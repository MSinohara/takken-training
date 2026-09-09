// Development-only cutover. Deploy 'freeze' before importing, then 'sql' after reconciliation.
function trainingAttachmentMode_() {
  if (!isSqlDataRuntime_()) return 'legacy';
  return 'sql';
}
function isSqlTrainingAttachmentEnabled_() { return trainingAttachmentMode_() === 'sql'; }
function guardLegacyAttachmentWrite_() {
  if (trainingAttachmentMode_() !== 'legacy') throw new Error('添付は専用の管理画面から変更してください。移行中はしばらくお待ちください。');
}
function requireAttachmentAdmin_(idToken) {
  if (!isSqlTrainingAttachmentEnabled_()) throw new Error('添付情報を移行中です。しばらくお待ちください。');
  return verifySqlAdminToken_(idToken,false).uid;
}
function attachmentGql_(query, variables, write) {
  if (!isSqlTrainingAttachmentEnabled_()) throw new Error('添付SQLはまだ利用できません。');
  const response = UrlFetchApp.fetch(getSqlDataConnectEndpoint_(write), {
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken()}, payload:JSON.stringify({query:query, variables:variables || {}})
  });
  if (response.getResponseCode() !== 200) throw new Error('添付SQLとの接続に失敗しました。');
  const result = JSON.parse(response.getContentText());
  if (result.errors || !result.data) throw new Error('添付の取得または保存に失敗しました。競合の可能性があるため再読み込みしてください。');
  return result.data;
}
function attachmentIds_(value) {
  const ids = Array.isArray(value) ? value.slice() : String(value || '').split(',').map(function(id){return id.trim();}).filter(Boolean);
  if (ids.length > 100 || ids.some(function(id){return typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id);}) || new Set(ids).size !== ids.length) throw new Error('添付IDが不正です。');
  return ids;
}
function readSqlAttachment_(eventId) {
  eventId = String(eventId || '').trim();
  if (!eventId) throw new Error('研修IDがありません。');
  const data = attachmentGql_('query($id:String!){ training(key:{trainingId:$id}){trainingId title} trainingAttachmentSet(key:{trainingId:$id}){revision} trainingAttachments(where:{trainingId:{eq:$id}},orderBy:[{position:ASC}],limit:101){fileId position} }', {id:eventId}, false);
  if (!data.training) throw new Error('SQLに研修会がありません。先に研修を保存してください。');
  if (!Array.isArray(data.trainingAttachments) || data.trainingAttachments.length > 100) throw new Error('添付情報を完全に取得できません。');
  const ids = attachmentIds_(data.trainingAttachments.map(function(row){return row.fileId;}));
  if (!data.trainingAttachmentSet) {
    // New SQL events can have no set. Never conceal unimported legacy attachments.
    const legacy = findLegacyTrainingById_(eventId);
    if (ids.length || (legacy && String(legacy.pdfFileId || '').trim())) throw new Error('未移行の添付があります。管理者へ確認してください。');
  }
  return {eventId:eventId, title:data.training.title, revision:data.trainingAttachmentSet ? data.trainingAttachmentSet.revision : 0, initialized:!!data.trainingAttachmentSet, fileIds:ids};
}
function sqlAttachmentProjection_(eventId, knownState) {
  const state = knownState || readSqlAttachment_(eventId);
  const files = state.fileIds.map(function(id){
    try {const file = DriveApp.getFileById(id); return {id:id,name:file.getName(),url:file.getUrl()};}
    catch (_error) {return {id:id,name:'参照できないファイル（ID: ' + id + '）',url:''};}
  });
  return {pdfFileId:state.fileIds.join(','),pdfFiles:files,pdfFileName:files.map(function(f){return f.name;}).join(' / '),pdfFileUrl:files.length === 1 ? files[0].url : '',attachmentRevision:state.revision};
}
function saveSqlAttachmentIds_(state, nextIds) {
  nextIds = attachmentIds_(nextIds);
  if (!Number.isInteger(state.revision) || state.revision < 0 || state.revision >= 2147483647) throw new Error('添付の版番号が不正です。');
  if (!state.initialized) {
    // Insert only: a concurrent initializer fails instead of overwriting its changes.
    attachmentGql_('mutation($id:String!){trainingAttachmentSet_insert(data:{trainingId:$id,revision:0})}', {id:state.eventId}, true);
  }
  const rows = nextIds.map(function(fileId,position){return {trainingId:state.eventId,fileId:fileId,position:position};});
  const query = 'mutation($id:String!,$revision:Int!,$next:Int!,$rows:[TrainingAttachment_Data!]! @allow(fields:"trainingId fileId position")) @transaction {' +
    'trainingAttachmentSet_updateMany(where:{trainingId:{eq:$id},revision:{eq:$revision}},data:{revision:$next,updatedAt_expr:"request.time"}) @check(expr:"this == 1",message:"添付情報が変更されています。再読込してください。") ' +
    'trainingAttachment_deleteMany(where:{trainingId:{eq:$id}}) ' +
    'trainingAttachment_insertMany(data:$rows) }';
  attachmentGql_(query, {id:state.eventId,revision:state.revision,next:state.revision+1,rows:rows}, true);
  return {ok:true,revision:state.revision+1,pdfFileId:nextIds.join(',')};
}
function checkedAttachmentState_(eventId, revision) {
  if (!/^(0|[1-9]\d*)$/.test(String(revision)) || !Number.isInteger(Number(revision))) throw new Error('版番号がありません。再読込してください。');
  const state = readSqlAttachment_(eventId);
  if (state.revision !== Number(revision)) throw new Error('添付情報が他の画面で更新されています。再読込してください。');
  return state;
}
function getSqlAttachmentPanel(idToken, eventId) {
  requireAttachmentAdmin_(idToken);
  const state = readSqlAttachment_(eventId);
  return {ok:true,eventId:state.eventId,title:state.title,revision:state.revision,...sqlAttachmentProjection_(eventId,state)};
}
function getSqlAttachmentCatalog(idToken, eventId, search) {
  requireAttachmentAdmin_(idToken);
  readSqlAttachment_(eventId);
  search = String(search || '').trim();
  if (search.length > 120) throw new Error('検索は120文字以内で入力してください。');
  // Folder-scoped Drive v2 search. Never enumerate the rest of Drive.
  const escaped = search.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const query = 'trashed = false' + (search ? " and title contains '" + escaped + "'" : '');
  const iterator = DriveApp.getFolderById(getConfig_('PDF_FOLDER_ID')).searchFiles(query);
  const files = [];
  while (iterator.hasNext() && files.length < 200) {
    const file = iterator.next();
    files.push({id:file.getId(),name:file.getName(),url:file.getUrl()});
  }
  const truncated = iterator.hasNext();
  files.sort(function(a,b){return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);});
  return {ok:true,files:files,truncated:truncated};
}
function unlinkSqlAttachment(idToken, eventId, revision, fileId) {
  requireAttachmentAdmin_(idToken);
  const state = checkedAttachmentState_(eventId,revision);
  const ids = attachmentIds_([fileId]);
  if (state.fileIds.indexOf(ids[0]) < 0) throw new Error('現在の添付にありません。再読込してください。');
  return saveSqlAttachmentIds_(state,state.fileIds.filter(function(id){return id !== fileId;}));
}
function reuseSqlAttachment(idToken, eventId, revision, fileId) {
  requireAttachmentAdmin_(idToken);
  const state = checkedAttachmentState_(eventId,revision);
  attachmentIds_([fileId]);
  // Only files in the configured attachment folder may be reused by supplied ID.
  const file = DriveApp.getFileById(fileId), parents = file.getParents();
  let allowed = false;
  while (parents.hasNext()) if (parents.next().getId() === getConfig_('PDF_FOLDER_ID')) allowed = true;
  if (!allowed || file.isTrashed()) throw new Error('添付フォルダ内の有効なファイルを指定してください。');
  if (state.fileIds.indexOf(fileId) >= 0) return {ok:true,revision:state.revision,pdfFileId:state.fileIds.join(',')};
  return saveSqlAttachmentIds_(state,state.fileIds.concat(fileId));
}
function uploadSqlAttachment(form) {
  requireAttachmentAdmin_(form && form.idToken);
  const state = checkedAttachmentState_(form.eventId,form.revision);
  const blobs = Array.isArray(form.pdfFile) ? form.pdfFile : form.pdfFile ? [form.pdfFile] : [];
  const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  if (!blobs.length || state.fileIds.length + blobs.length > 100) throw new Error('ファイルを選択してください。添付上限は100件です。');
  if (blobs.some(function(blob){return !blob || typeof blob.getContentType !== 'function' || allowed.indexOf(blob.getContentType()) < 0;})) throw new Error('PDF、Word、Excel、PowerPointを指定してください。');
  const folder = DriveApp.getFolderById(getConfig_('PDF_FOLDER_ID'));
  for (const blob of blobs) {
    const same = folder.getFilesByName(blob.getName());
    if (same.hasNext()) {const f = same.next(); return {ok:false,duplicate:true,fileId:f.getId(),message:'同名ファイルがあります。既存IDを利用するか、別名でアップロードしてください。'};}
  }
  const created = [];
  try {
    for (const blob of blobs) created.push(folder.createFile(blob).getId());
    const result = saveSqlAttachmentIds_(state,state.fileIds.concat(created));
    return Object.assign(result,{createdFileIds:created});
  } catch (_error) {
    // Never delete uploaded files on failure. Report IDs for deliberate retry/reuse.
    return {ok:false,createdFileIds:created,message:'作成またはSQL保存に失敗しました。再読込後に確認してください。作成済みファイルはDriveに残しています。'};
  }
}
function doPost(e) {
  try {
    const p = e && e.parameter || {};
    if (p.action === 'sqlAdminPanel') {
      verifySqlAdminToken_(p.idToken,false);
      const adminTemplate=HtmlService.createTemplateFromFile('SQL管理権限画面');
      adminTemplate.idToken=p.idToken;
      adminTemplate.registerUrl=getSqlAdminEnvironment_().registerUrl;
      return adminTemplate.evaluate().setTitle('SQL管理者マスタ');
    }
    if (p.action !== 'sqlAttachmentPanel') throw new Error('未対応の操作です。');
    requireAttachmentAdmin_(p.idToken);
    const state = readSqlAttachment_(p.eventId);
    const template = HtmlService.createTemplateFromFile('SQL添付詳細画面');
    const embedded = p.embedded === 'detail';
    const adminEnvironment = getSqlAdminEnvironment_();
    const adminOriginMatch = String(adminEnvironment.registerUrl || '').match(/^(https:\/\/[^/]+)/);
    if (!adminOriginMatch) throw new Error('管理サイトURLを確認できません。');
    template.bootstrap = JSON.stringify({idToken:p.idToken,eventId:state.eventId,embedded:embedded,adminOrigin:adminOriginMatch[1]}).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
    const output = template.evaluate().setTitle('添付資料');
    // The embedded template fails closed unless the browser's top ancestor is
    // the matching management site. No token is sent through postMessage or the URL.
    if (embedded) output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return output;
  } catch (_error) {
    // Never reflect token-bearing request parameters into errors or logs.
    return HtmlService.createHtmlOutput('添付管理を開けませんでした。移行中または管理者確認の期限切れです。元の画面から開き直してください。');
  }
}
