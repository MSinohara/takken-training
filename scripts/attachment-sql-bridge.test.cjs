const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('GAS/SQL添付接続.js','utf8'),adminSource=fs.readFileSync('GAS/SQL管理権限.js','utf8');
function setup(options={}){
  const calls=[];
  const context=vm.createContext({ScriptApp:{getScriptId:()=>options.production?'production':'1x6VS29Olp_HZES95ApKdWqCMHZ_dN6tajTulgutb4BA3GSG4SBl-IQ7J',getOAuthToken:()=>'iam-test'},
    findLegacyTrainingById_:()=>options.legacy || null,
    Utilities:{base64DecodeWebSafe:()=>[],newBlob:()=>({getDataAsString:()=>JSON.stringify({aud:'takken-training-demo',iss:'https://securetoken.google.com/takken-training-demo',sub:'admin',exp:Math.floor(Date.now()/1000)+3600,...options.claims})})},
    UrlFetchApp:{fetch:(url,args)=>{const payload=JSON.parse(args.payload);calls.push({url,payload});
      const auth=url.includes('identitytoolkit');
      return {getResponseCode:()=>auth && options.expired?400:200,getContentText:()=>JSON.stringify(auth?{users:[{localId:'admin',email:'ohzakai.kk@gmail.com',emailVerified:true,...options.user}]}:
        options.sqlError?{errors:[{message:'conflict'}]}:{data:payload.query.startsWith('query')?{training:{trainingId:'T',title:'SQL'},trainingAttachmentSet:options.newEvent?null:{revision:3},trainingAttachments:options.newEvent?[]:[{fileId:'a',position:0},{fileId:'b',position:1}]}:{done:true}})};}},
    DriveApp:new Proxy({}, {get(){throw Error('Drive mutation not allowed in test');}}),
  });
  vm.runInContext(adminSource+'\n'+source,context);
  if(!options.production)context.trainingAttachmentMode_=()=> options.freeze ? 'freeze' : 'sql';
  return {context,calls};
}
test('unauthenticated, non-admin, expired and unverified requests stop before SQL or Drive',()=>{
  for(const options of [{user:{email:'other@example.com'}},{user:{emailVerified:false}},{user:{disabled:true}},{expired:true}]){
    const {context,calls}=setup(options);assert.throws(()=>context.unlinkSqlAttachment('token','T',3,'a'));
    assert.equal(calls.length,1);assert.match(calls[0].url,/identitytoolkit/);
  }
  const {context,calls}=setup();assert.throws(()=>context.uploadSqlAttachment({}));assert.equal(calls.length,0);
});
test('unlink verifies authority then writes only attachment tables under transaction and revision check',()=>{
  const {context,calls}=setup(); const result=context.unlinkSqlAttachment('token','T',3,'a');
  assert.equal(result.pdfFileId,'b');assert.equal(result.revision,4);
  assert.equal(calls.length,3);const mutation=calls[2].payload;
  assert.match(mutation.query,/@transaction/);assert.match(mutation.query,/@check\(expr:"this == 1"/);
  assert.deepEqual(mutation.variables.rows,[{trainingId:'T',fileId:'b',position:0}]);
  assert.doesNotMatch(mutation.query,/training_update|attendance|Mail|Firestore/);
});
test('stale or unknown selection refuses before a mutation',()=>{
  for(const [revision,id] of [[2,'a'],[3,'unknown'],['','a']]){
    const {context,calls}=setup();assert.throws(()=>context.unlinkSqlAttachment('token','T',revision,id));
    assert.ok(calls.every(c=>!c.payload.query || c.payload.query.startsWith('query')));
  }
});
test('SQL read errors never use legacy attachments; unimported legacy attachments fail closed',()=>{
  assert.throws(()=>setup({sqlError:true}).context.readSqlAttachment_('T'),/再読み込み/);
  assert.throws(()=>setup({newEvent:true,legacy:{pdfFileId:'old'}}).context.readSqlAttachment_('T'),/未移行/);
  const state=setup({newEvent:true}).context.readSqlAttachment_('T');assert.equal(state.initialized,false);assert.equal(state.revision,0);
});
test('freeze and production do not allow new SQL attachment access',()=>{
  for(const options of [{freeze:true},{production:true}]){
    const {context,calls}=setup(options);assert.throws(()=>context.requireAttachmentAdmin_('token'));assert.equal(calls.length,0);
  }
});
test('verified tokens from another project, subject or expired claim cannot reach SQL',()=>{
  for(const claims of [{aud:'other'},{iss:'https://other.example'},{sub:'other'},{exp:0}]) {
    const {context,calls}=setup({claims});assert.throws(()=>context.unlinkSqlAttachment('token','T',3,'a'));assert.equal(calls.length,1);
  }
});
test('old upload, reuse, append, overwrite and unlink reject before side effects after freeze',()=>{
  const {context,calls}=setup({freeze:true});
  for(const name of ['GAS/修了証.js','GAS/メール送信管理.js'])vm.runInContext(fs.readFileSync(name,'utf8'),context);
  for(const action of [()=>context.uploadTrainingPdfFromForm({}),()=>context.useExistingTrainingPdf('T','a'),()=>context.appendTrainingPdfFileIds_('T',['a']),()=>context.updateTrainingPdfFileId_('T',''),()=>context.deleteTrainingPdf_('T','a')]) assert.throws(action,/専用/);
  assert.equal(calls.length,0);
});
test('blank, duplicate or unsafe file IDs are rejected',()=>{
  const {context}=setup();for(const ids of [['a','a'],[''],['https://example.com'],['a,b']])assert.throws(()=>context.attachmentIds_(ids));
});
test('new upload page never embeds raw bootstrap markup and only sends auth in POST body',()=>{
  assert.match(source,/replace\(\/<\/g/);
  const js=fs.readFileSync('public/sql/js/training-attachments.js','utf8');assert.match(js,/form.method = 'POST'/);assert.doesNotMatch(js,/localStorage|sessionStorage|console\.log|idToken=/);
});
test('upload success appends SQL IDs without touching existing files',()=>{
  const {context,calls}=setup();let creates=0;
  context.getConfig_=()=> 'folder';
  context.DriveApp={getFolderById:()=>({getFilesByName:()=>({hasNext:()=>false}),createFile:()=>({getId:()=> 'new_'+(++creates)})})};
  const blob={getContentType:()=> 'application/pdf',getName:()=> 'new.pdf'};
  const result=context.uploadSqlAttachment({idToken:'token',eventId:'T',revision:3,pdfFile:blob});
  assert.equal(result.ok,true);assert.equal(result.pdfFileId,'a,b,new_1');assert.equal(creates,1);
  assert.equal(calls.at(-1).payload.variables.rows.length,3);
});
test('post-upload SQL failure returns created IDs without deleting files',()=>{
  const {context}=setup();context.getConfig_=()=> 'folder';
  context.DriveApp={getFolderById:()=>({getFilesByName:()=>({hasNext:()=>false}),createFile:()=>({getId:()=> 'created'})})};
  const original=context.attachmentGql_;context.attachmentGql_=(q,v,write)=>{if(write)throw Error('conflict');return original(q,v,write);};
  const result=context.uploadSqlAttachment({idToken:'token',eventId:'T',revision:3,pdfFile:{getContentType:()=> 'application/pdf',getName:()=> 'new.pdf'}});
  assert.equal(result.ok,false);assert.equal(result.createdFileIds.join(','),'created');assert.match(result.message,/Driveに残して/);
});
test('partial upload failure preserves and identifies files already created',()=>{
  const {context}=setup();let n=0;context.getConfig_=()=> 'folder';
  context.DriveApp={getFolderById:()=>({getFilesByName:()=>({hasNext:()=>false}),createFile:()=>{if(n++)throw Error('upload failed');return {getId:()=> 'first'};}})};
  const blob={getContentType:()=> 'application/pdf',getName:()=> 'new.pdf'};
  const result=context.uploadSqlAttachment({idToken:'token',eventId:'T',revision:3,pdfFile:[blob,blob]});
  assert.equal(result.ok,false);assert.equal(result.createdFileIds.join(','),'first');
});
test('same-name files and unsupported MIME stop before file creation or SQL mutation',()=>{
  const {context,calls}=setup();context.getConfig_=()=> 'folder';
  context.DriveApp={getFolderById:()=>({getFilesByName:()=>({hasNext:()=>true,next:()=>({getId:()=> 'existing'})}),createFile:()=>{throw Error('must not create');}})};
  const result=context.uploadSqlAttachment({idToken:'token',eventId:'T',revision:3,pdfFile:{getContentType:()=> 'application/pdf',getName:()=> 'same.pdf'}});
  assert.equal(result.duplicate,true);assert.equal(result.fileId,'existing');
  assert.throws(()=>context.uploadSqlAttachment({idToken:'token',eventId:'T',revision:3,pdfFile:{getContentType:()=> 'application/x-executable'}}));
  assert.ok(calls.every(c=>!c.payload.query || c.payload.query.startsWith('query')));
});
test('template JavaScript parses and does not disable file inputs before serialization',()=>{
  const html=fs.readFileSync('GAS/SQL添付詳細画面.html','utf8');
  const script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace('<?!= bootstrap ?>',JSON.stringify({idToken:'test',eventId:'T'}));
  new vm.Script(script);assert.match(script,/querySelectorAll\('button'\)/);assert.doesNotMatch(script,/querySelectorAll\('button,input'\)/);
});
test('ordinary training save preserves old attachment columns after cutover',()=>{
  const js=fs.readFileSync('GAS/研修会管理.js','utf8');
  assert.match(js,/trainingAttachmentMode_\(\) === 'legacy'\) setValue\("PDFファイルID"/);
  for(const file of ['public/training-form.html','public/mail-send.html'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/pdfFileId:\s*document\.getElementById/);
});
test('catalog is folder-scoped, bounded, sorted and escapes search text',()=>{
  const {context}=setup();let query='';context.getConfig_=()=> 'folder';
  const rows=[{getId:()=> 'b',getName:()=> 'Zulu',getUrl:()=> 'https://drive.google.com/b'},{getId:()=> 'a',getName:()=> 'Alpha',getUrl:()=> 'https://drive.google.com/a'}];
  context.DriveApp={getFolderById:id=>{assert.equal(id,'folder');return {searchFiles:q=>{query=q;let i=0;return {hasNext:()=>i<rows.length,next:()=>rows[i++]};}}}};
  const result=context.getSqlAttachmentCatalog('token','T',"O'Brien");assert.deepEqual(Array.from(result.files,f=>f.name),['Alpha','Zulu']);assert.equal(result.truncated,false);
  assert.match(query,/trashed = false/);assert.match(query,/title contains 'O\\'Brien'/);assert.doesNotMatch(source,/DriveApp\.searchFiles/);
});
test('embedded attachment output uses explicit frame mode and top-origin clickjacking guard',()=>{
  assert.match(source,/embedded\) output\.setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\)/);
  const html=fs.readFileSync('GAS/SQL添付詳細画面.html','utf8');
  assert.match(source,/adminOrigin:adminOriginMatch\[1\]/);
  assert.match(html,/origins\[origins\.length-1\]===adminOrigin/);
  assert.match(html,/boot\.adminOrigin\+'\/training-form\.html\?event='/);
  const fn=html.match(/function allowedEmbedContext\([\s\S]*?\}/)[0],ctx=vm.createContext({});vm.runInContext(fn,ctx);
  assert.equal(ctx.allowedEmbedContext(true,['https://tokyo-takken-10block.web.app'],'https://tokyo-takken-10block.web.app'),true);
  assert.equal(ctx.allowedEmbedContext(true,['https://takken-training-demo.web.app'],'https://takken-training-demo.web.app'),true);
  assert.equal(ctx.allowedEmbedContext(true,['https://tokyo-takken-10block.web.app','https://attacker.example'],'https://tokyo-takken-10block.web.app'),false);
  assert.equal(ctx.allowedEmbedContext(true,undefined,'https://tokyo-takken-10block.web.app'),false);assert.equal(ctx.allowedEmbedContext(false,undefined,''),true);
});
test('attachment editing stays in editor and never displaces detail statistics',()=>{
  const detail=fs.readFileSync('public/training-detail.html','utf8'),client=fs.readFileSync('public/sql/js/training-attachments.js','utf8'),html=fs.readFileSync('GAS/SQL添付詳細画面.html','utf8');
  assert.doesNotMatch(detail,/detailAttachments|training-attachments|attachmentFrame/);
  assert.match(detail,/id="stats"/);
  const editor=fs.readFileSync('public/training-form.html','utf8');
  assert.match(editor,/api\.embed\(eventId,document\.getElementById\('attachmentEditorFrame'\)/);
  assert.doesNotMatch(editor,/添付管理へ移動します/);
  assert.match(client,/form\.target=frame\.name/);assert.match(client,/embedded:'detail'/);assert.match(client,/crypto\.randomUUID/);
  assert.match(html,/ファイル名で検索/);assert.match(html,/ファイルを選択/);assert.doesNotMatch(html,/添付フォルダ内のファイルID/);
  assert.doesNotMatch(html,/confirm\(/);
});
test('null, booleans and negative revisions cannot initialize or overwrite attachments',()=>{
  for(const revision of [null,undefined,false,true,-1,'','01']){
    const {context,calls}=setup({newEvent:true});assert.throws(()=>context.checkedAttachmentState_('T',revision),/版番号/);assert.equal(calls.length,0);
  }
});
