import {initializeApp,getApps} from 'firebase/app';
import {getDataConnect,queryRef,executeQuery} from 'firebase/data-connect';
import {firebaseConfig} from './config.js?v=17';

const app=getApps()[0]||initializeApp(firebaseConfig);
const dc=getDataConnect(app,{connector:'example',service:'takken-training',location:'asia-northeast1'});

export async function get(trainingId){
  trainingId=String(trainingId||'').trim();
  if(!trainingId)throw new Error('研修IDが指定されていません。');
  const response=await executeQuery(queryRef(dc,'PublicTrainingDisplay',{trainingId}),{fetchPolicy:'SERVER_ONLY'});
  const row=response.data&&response.data.training;
  if(!row||row.active!==true)throw new Error('行事情報を取得できませんでした。');
  return {eventId:row.trainingId,title:row.title||'',eventDate:row.eventDate||'',hostType:row.hostType||'',receptionType:row.receptionType||'',attendanceUnit:row.attendanceUnit||'会社',checkinTargetMode:row.checkinTargetMode||''};
}

export async function list(){
  const response=await executeQuery(queryRef(dc,'PublicActiveTrainingDisplays',{}),{fetchPolicy:'SERVER_ONLY'});
  const rows=response.data&&response.data.trainings;
  if(!Array.isArray(rows)||rows.length>=1000)throw new Error('受付可能な行事一覧を完全に取得できません。');
  return rows.map(row=>({eventId:row.trainingId,title:row.title||'',eventDate:row.eventDate||'',hostType:row.hostType||'',receptionType:row.receptionType||'',attendanceUnit:row.attendanceUnit||'会社',checkinTargetMode:row.checkinTargetMode||'',active:true}));
}
