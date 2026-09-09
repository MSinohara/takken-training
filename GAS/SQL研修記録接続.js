// Development only. SQL is authoritative; no Firestore or sheet fallback for records.
function isSqlTrainingRecordEnabled_() {
  return isSqlDataRuntime_();
}
function sqlTrainingRecordFields_() { return ["venueName","venueAddress","venueContactName","venueContactPhone","venueContactMail","venueUrl","venueCapacity","startTime","endTime","lecturerName","lecturerOrg","lecturerContact","venueCost","venueFeeMemo","lecturerCost","printCost","drinkCost","otherCost","costNote","eventMemo"]; }
function sqlTrainingRecordHeaders_() { return {"venueName":"会場名","venueAddress":"会場住所","venueContactName":"会場担当者","venueContactPhone":"会場連絡先","venueContactMail":"会場メール","venueUrl":"会場URL","venueCapacity":"会場定員","startTime":"開始時刻","endTime":"終了時刻","lecturerName":"講師名","lecturerOrg":"講師所属","lecturerContact":"講師連絡先","venueCost":"会場費","venueFeeMemo":"会場費メモ","lecturerCost":"講師費","printCost":"資料印刷費","drinkCost":"飲み物代","otherCost":"その他費用","costNote":"費用備考","eventMemo":"実施メモ"}; }
var sqlTrainingRecordStoreCache_ = null;
function readSqlTrainingRecordStore_() {
  if (!isSqlTrainingRecordEnabled_()) throw new Error('SQL研修記録は開発環境に限定されています。');
  if (sqlTrainingRecordStoreCache_) return sqlTrainingRecordStoreCache_;
  const response = UrlFetchApp.fetch(getSqlDataConnectEndpoint_(false), {
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken()},
    payload:JSON.stringify({query:"query { trainings(orderBy:[{trainingId:ASC}],limit:1000){trainingId title eventDate active venueId hostType receptionType attendanceUnit checkinTargetMode eventType targetBlock targetBranch targetDistrict targetOrgIdsNew senderOrganizationId "+(typeof isSqlTrainingCoreEnabled_==='function' && isSqlTrainingCoreEnabled_()?'mailSignatureId statsOrgMode statsOrgIds ':'')+"certificateEnabled locationCheckEnabled locationCheckinStart locationCheckinEnd attendanceConfirmEnabled attendanceStatusPublic subject body} trainingRecords(orderBy:[{trainingId:ASC}],limit:1000){trainingId venueName venueAddress venueContactName venueContactPhone venueContactMail venueUrl venueCapacity startTime endTime lecturerName lecturerOrg lecturerContact venueCost venueFeeMemo lecturerCost printCost drinkCost otherCost costNote eventMemo updatedAt} venues(limit:1000){venueId venueName venueAddress venueContactName venueContactPhone venueContactMail venueUrl venueApplicationUrl venueCapacity latitude longitude geoRadius geoCheckedAt geoMemo active} }"})
  });
  if (response.getResponseCode() !== 200) throw new Error('SQL研修記録を取得できません（HTTP ' + response.getResponseCode() + '）。');
  const result = JSON.parse(response.getContentText()), data = result.data;
  if (result.errors || !data || ['trainings','trainingRecords','venues'].some(function(key){return !Array.isArray(data[key]) || data[key].length >= 1000;})) {
    throw new Error('SQL研修記録を完全に取得できません。');
  }
  sqlTrainingRecordStoreCache_ = data;
  return data;
}

function getSqlVenueMastersForGas_() {
  const rows = readSqlTrainingRecordStore_().venues || [];
  return rows.map(function(row) {
    return {
      venueId: String(row.venueId || ''),
      venueName: String(row.venueName || ''),
      venueAddress: String(row.venueAddress || ''),
      venueContactName: String(row.venueContactName || ''),
      venueContactPhone: String(row.venueContactPhone || ''),
      venueContactMail: String(row.venueContactMail || ''),
      venueUrl: String(row.venueUrl || ''),
      venueApplicationUrl: String(row.venueApplicationUrl || ''),
      venueCapacity: row.venueCapacity == null ? '' : String(row.venueCapacity),
      latitude: row.latitude == null ? '' : String(row.latitude),
      longitude: row.longitude == null ? '' : String(row.longitude),
      geoRadius: row.geoRadius == null ? '' : String(row.geoRadius),
      geoCheckedAt: formatDateTimeForClient_(row.geoCheckedAt),
      geoMemo: String(row.geoMemo || ''),
      active: row.active === false ? 'FALSE' : 'TRUE'
    };
  }).sort(function(a, b) {
    return a.venueName.localeCompare(b.venueName, 'ja');
  });
}
function mapSqlTrainingRecord_(training, store) {
  const record = store.trainingRecords.find(function(row){return row.trainingId === training.trainingId;});
  const venue = store.venues.find(function(row){return row.venueId === training.venueId;}) || {};
  const result = Object.assign({}, training, {eventId:training.trainingId, senderOrgId:training.senderOrganizationId || '', recordUpdatedAt:record ? record.updatedAt : ''});
  sqlTrainingRecordFields_().forEach(function(field){result[field] = record && record[field] != null ? String(record[field]) : '';});
  ['venueName','venueAddress','venueContactName','venueContactPhone','venueContactMail','venueUrl','venueCapacity'].forEach(function(field){
    if (venue[field] != null && String(venue[field]) !== '') result[field] = String(venue[field]);
  });
  return result;
}
function getSqlTrainingRecord_(eventId) {
  const store = readSqlTrainingRecordStore_();
  const training = store.trainings.find(function(row){return row.trainingId === String(eventId || '').trim();});
  return training ? mapSqlTrainingRecord_(training, store) : null;
}
function listSqlActiveTrainings_() {
  const store = readSqlTrainingRecordStore_();
  return store.trainings.filter(function(row){return row.active === true;}).map(function(row){
    // Keep the legacy list projection: do not expose record/contact fields here.
    return {eventId:row.trainingId,title:row.title,eventDate:row.eventDate,
      eventType:row.eventType || '研修会',hostType:row.hostType || '',receptionType:row.receptionType || '',
      attendanceUnit:row.attendanceUnit || '会社',certificateEnabled:row.certificateEnabled === false ? 'FALSE' : 'TRUE',
      attendanceConfirmEnabled:row.attendanceConfirmEnabled === true};
  });
}
function getSqlTrainingRecords_() {
  const summaryResult = getTrainingStatsSummaries_();
  if (!summaryResult || !summaryResult.ok) throw new Error('研修会集計を取得できません。');
  const summaries = summaryResult.summaries || {};
  const store = readSqlTrainingRecordStore_();
  const records = store.trainings.filter(function(row){return row.active === true;}).map(function(training){
    const record = mapSqlTrainingRecord_(training, store);
    const summary = summaries[record.eventId] || {};
    return Object.assign(record, {
      targetCount:summary.targetCount || 0, attendedCount:summary.attendedCount || 0,
      outsideAttendedCount:summary.outsideAttendedCount || 0,
      totalAttendedCount:summary.totalAttendedCount || summary.attendedCount || 0,
      attendanceRate:summary.attendanceRate || '未集計', statsUpdatedAt:summary.updatedAt || '',
      totalCost:['venueCost','lecturerCost','printCost','drinkCost','otherCost'].reduce(function(sum,key){
        const value = Number(String(record[key] || '').replace(/,/g,''));
        return sum + (isFinite(value) ? value : 0);
      },0)
    });
  });
  records.sort(function(a,b){return String(b.eventDate).localeCompare(String(a.eventDate)) || String(b.eventId).localeCompare(String(a.eventId));});
  return {ok:true, records:records};
}
function guardLegacyTrainingRecordWrite_(data) {
  if (!isSqlTrainingRecordEnabled_()) return;
  const recordOnlyFields = sqlTrainingRecordFields_().filter(function(field){return !field.startsWith('venue') || field === 'venueCost' || field === 'venueFeeMemo';});
  if (recordOnlyFields.some(function(field){return Object.prototype.hasOwnProperty.call(data || {},field);})) {
    throw new Error('研修記録の保存はSQLへ移行しました。記録入力画面を再読み込みしてください。');
  }
  if (!getSqlTrainingRecord_(data && data.eventId)) throw new Error('SQLに研修会がありません。先にSQL画面から保存してください。');
}
// Merge SQL core and record values into backup output; keep legacy-only attachment/settings columns.
function sqlTrainingBackupRows_(values, eventId) {
  const store = readSqlTrainingRecordStore_();
  const headers = (values[0] || []).slice(), idIndex = headers.indexOf('研修ID');
  const columns = Object.assign({
    trainingId:'研修ID', title:'研修名', eventDate:'開催日', active:'有効', venueId:'会場ID',
    hostType:'主催区分', receptionType:'受付方式', attendanceUnit:'受付単位', checkinTargetMode:'受付対象方式',
    eventType:'イベント種別', targetBlock:'対象ブロック', targetBranch:'対象支部', targetDistrict:'対象地区',
    targetOrgIdsNew:'対象組織ID', senderOrganizationId:'差出人組織ID', certificateEnabled:'修了証発行',
    locationCheckEnabled:'位置情報受付',locationCheckinStart:'位置情報受付開始',locationCheckinEnd:'位置情報受付終了',
    attendanceConfirmEnabled:'出欠回答',attendanceStatusPublic:'出欠状況公開',subject:'件名',body:'本文',
    recordUpdatedAt:'記録更新日時'
  }, sqlTrainingRecordHeaders_());
  Object.keys(columns).forEach(function(key){if(headers.indexOf(columns[key]) < 0) headers.push(columns[key]);});
  if(typeof isSqlTrainingCoreEnabled_==='function' && isSqlTrainingCoreEnabled_()){
    Object.assign(columns,{mailSignatureId:'メール署名ID',statsOrgMode:'集計表示組織区分',statsOrgIds:'集計表示組織ID'});
    Object.keys(columns).forEach(function(key){if(headers.indexOf(columns[key])<0)headers.push(columns[key]);});
  }
  const rows = [headers];
  store.trainings.filter(function(training){return !eventId || training.trainingId === eventId;}).forEach(function(training){
    const legacy = values.slice(1).find(function(row){return String(row[idIndex] || '').trim() === training.trainingId;}) || [];
    const row = headers.map(function(_h,i){return legacy[i] == null ? '' : legacy[i];});
    const record = mapSqlTrainingRecord_(training,store);
    Object.keys(columns).forEach(function(key){row[headers.indexOf(columns[key])] = record[key] == null ? '' : record[key];});
    if (typeof isSqlTrainingAttachmentEnabled_ === 'function' && isSqlTrainingAttachmentEnabled_()) {
      const pdfIndex = headers.indexOf('PDFファイルID');
      if (pdfIndex < 0) throw new Error('添付バックアップ列がありません。');
      row[pdfIndex] = readSqlAttachment_(training.trainingId).fileIds.join(',');
    }
    rows.push(row);
  });
  if (eventId && rows.length !== 2) throw new Error('SQL研修会をバックアップできません。');
  return rows;
}
