const {validId}=require('../miniprogram/domain/admin');
const {error}=require('./permissions');
function createReminderRepository(cloud){
 const db=cloud.database(),nid=id=>'confirmation-'+id;
 async function read(tx,name,id){try{const r=await tx.collection(name).doc(id).get();return Array.isArray(r.data)?r.data[0]||null:r.data||null;}catch(e){if(/document.*(not exist|not found)/i.test(e.message||e.errMsg||''))return null;throw e;}}
 async function byId(name,id){const r=await db.collection(name).where({_id:id}).limit(1).get();return r.data[0]||null;}
 const check=id=>{if(!validId(id))throw error('INVALID_APPOINTMENT','预约编码无效');};
 return {
  getAppointment:id=>{check(id);return byId('appointments',id);},
  async subscribe({id,owner,templateId}){check(id);return db.runTransaction(async tx=>{const a=await read(tx,'appointments',id);if(!a||a.owner!==owner)throw error('FORBIDDEN','预约不存在或无权操作');if(a.status!=='pending')throw error('INVALID_APPOINTMENT','仅待确认预约可以开启提醒');const {_id,...saved}=a;saved.confirmationReminder={templateId,acceptedAt:new Date().toISOString()};await tx.collection('appointments').doc(id).set({data:saved});return {accepted:true};});},
  async claim({id,templateId,now}){check(id);return db.runTransaction(async tx=>{
   const old=await read(tx,'appointment_notifications',nid(id));if(old)return {claimed:false,status:old.status};
   const a=await read(tx,'appointments',id);if(!a||a.status!=='confirmed'||!a.owner||!a.confirmationReminder)return {claimed:false,status:'skipped'};
   if(a.confirmationReminder.templateId!==templateId){await tx.collection('appointment_notifications').doc(nid(id)).set({data:{appointmentId:id,status:'outdated',templateId,code:'TEMPLATE_CHANGED',finishedAt:(now||new Date()).toISOString()}});return {claimed:false,status:'outdated'};}
   await tx.collection('appointment_notifications').doc(nid(id)).set({data:{appointmentId:id,status:'sending',templateId,startedAt:(now||new Date()).toISOString()}});return {claimed:true,appointment:a,status:'sending'};
  });},
  async finish({id,status,code,now}){check(id);if(!['accepted','failed','unknown'].includes(status))throw error('INVALID_REMINDER','提醒状态无效');return db.runTransaction(async tx=>{const r=await read(tx,'appointment_notifications',nid(id));if(!r||r.status!=='sending')return;const {_id,...saved}=r;await tx.collection('appointment_notifications').doc(nid(id)).set({data:{...saved,status,code:String(code||'').slice(0,40),finishedAt:(now||new Date()).toISOString()}});});},
  async getStatus(id){check(id);const r=await byId('appointment_notifications',nid(id));return r?r.status:'none';},
  async checkConnection(){await db.collection('appointments').where({_id:'setup-check'}).limit(1).get();await db.collection('appointment_notifications').where({_id:'setup-check'}).limit(1).get();return true;}
 };
}
module.exports={createReminderRepository};
