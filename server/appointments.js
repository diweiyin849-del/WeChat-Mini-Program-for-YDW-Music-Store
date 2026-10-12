const crypto=require('node:crypto');
const {validId}=require('../miniprogram/domain/admin');
const {buildAppointment}=require('../miniprogram/domain/appointments');
const {requireAdmin,error}=require('./permissions');
const actions=['createAppointment','listMyAppointments','cancelAppointment','adminListAppointments','adminSetAppointmentStatus'];
function createAppointmentHandlers({repository,identity,now,reminders}){
 const withStatus=async rows=>Promise.all(rows.map(async a=>{let reminderStatus='none';if(reminders){try{reminderStatus=await reminders.status(a.id);}catch(e){reminderStatus='unavailable';}}return {...a,reminderStatus};}));
 return {async handle(action,payload){const p=payload||{},owner=identity.openid;if(!owner)throw error('FORBIDDEN','请先登录后再预约');
  if(action==='createAppointment'){
   if(!validId(p.requestId))throw error('INVALID_APPOINTMENT','预约编码无效');
   const id='a-'+crypto.createHash('sha256').update(owner+'\0'+p.requestId).digest('hex');
   const old=await repository.getAppointment(id);if(old)return old;
   const product=await repository.getProduct(p.productId),record=buildAppointment(p,{now:now?now():new Date(),product,owner,id});
   return repository.createAppointmentOnce(record);
  }
  if(action==='listMyAppointments')return withStatus(await repository.listAppointments(owner));
  if(action==='cancelAppointment')return repository.transitionAppointment({id:p.id,actor:owner,admin:false,status:'cancelled'});
  await requireAdmin(repository,identity);
  if(action==='adminListAppointments')return withStatus(await repository.listAppointments());
  if(action==='adminSetAppointmentStatus'){
   const a=await repository.transitionAppointment({id:p.id,actor:owner,admin:true,status:p.status});let reminderStatus='none';
   if(reminders&&p.status==='confirmed'){try{reminderStatus=await reminders.sendConfirmation(a.id);}catch(e){reminderStatus='unknown';}}
   return {...a,reminderStatus};
  }
  throw error('UNKNOWN_ACTION','未知预约操作');
 }};
}
module.exports={createAppointmentHandlers,appointmentActions:actions};
