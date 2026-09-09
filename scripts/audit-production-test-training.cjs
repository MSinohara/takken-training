"use strict";
const path=require("path");
(async()=>{
 const cli=process.env.FIREBASE_TOOLS_ROOT;if(!cli)throw Error("FIREBASE_TOOLS_ROOT is required");
 const {Client}=require(path.join(cli,"lib/apiv2")),{requireAuth}=require(path.join(cli,"lib/requireAuth")),{getProjectDefaultAccount}=require(path.join(cli,"lib/auth"));
 await requireAuth({project:"tokyo-takken-10block",...getProjectDefaultAccount(process.cwd()),nonInteractive:true});
 const api=new Client({urlPrefix:"https://firebasedataconnect.googleapis.com",apiVersion:"v1",auth:true});
 const service="/projects/tokyo-takken-10block/locations/asia-northeast1/services/takken-training:executeGraphqlRead";
 const query=`query{trainings(where:{trainingId:{eq:"2026-999"}},limit:2){trainingId title attendanceUnit receptionType checkinTargetMode targetBranch targetDistrict targetBlock targetOrgIdsNew venueId locationCheckEnabled locationCheckinStart locationCheckinEnd attendanceConfirmEnabled certificateEnabled active} venues(limit:1000){venueId venueName latitude longitude active} trainingTargets(where:{trainingId:{eq:"2026-999"}},limit:5000){targetType targetId branch district} plannedAttendees(where:{trainingId:{eq:"2026-999"}},limit:5000){plannedId}}`;
 const body=(await api.post(service,{query,variables:{}})).body;if(body.errors||!body.data)throw Error(JSON.stringify(body.errors||body));
 const training=body.data.trainings[0]||null,targets=body.data.trainingTargets||[];
 const venue=training?(body.data.venues||[]).find(row=>row.venueId===training.venueId)||null:null;
 console.log(JSON.stringify({trainingCount:body.data.trainings.length,training,venue,targetCount:targets.length,targetTypes:targets.reduce((m,r)=>(m[r.targetType]=(m[r.targetType]||0)+1,m),{}),targetBranches:[...new Set(targets.map(r=>r.branch).filter(Boolean))],plannedCount:(body.data.plannedAttendees||[]).length,writes:0,mailsSent:0+0},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
