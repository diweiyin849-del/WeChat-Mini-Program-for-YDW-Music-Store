const {buildAppointment,nextStatus}=require('../domain/appointments');
const {validId}=require('../domain/admin');
function createAppointmentService(platform,storage,mode,catalog,options){
 const now=()=>options&&options.now?options.now():new Date();
 if(mode==='cloud'){
  const call=async(action,payload)=>{const r=await platform.cloud.callFunction({name:'store',data:{action,payload:payload||{}}});if(!r.result||!r.result.ok)throw new Error(r.result&&r.result.error&&r.result.error.message||'预约服务暂不可用');return r.result.data;};
  return {getReminderConfig:()=>call('getAppointmentReminderConfig'),subscribeReminder:p=>call('subscribeAppointmentReminder',p),adminCheckSetup:()=>call('adminCheckAppointmentSetup'),createAppointment:p=>call('createAppointment',p),listMyAppointments:()=>call('listMyAppointments'),cancelAppointment:id=>call('cancelAppointment',{id}),adminListAppointments:()=>call('adminListAppointments'),adminSetAppointmentStatus:p=>call('adminSetAppointmentStatus',p),clear:()=>{}};
 }
 const read=()=>{const raw=storage.read('appointments',[]),seen=new Set();const valid=raw.filter(a=>{
  const ok=a&&typeof a.id==='string'&&/^demo-[a-zA-Z0-9_-]{1,80}$/.test(a.id)&&!seen.has(a.id)&&a.owner==='demo'&&validId(a.requestId)&&validId(a.productId)&&validId(a.skuId)&&typeof a.productTitle==='string'&&typeof a.contact==='string'&&a.contact.trim().length>0&&a.contact.length<=30&&/^\+?\d{7,15}$/.test(a.phone)&&typeof a.note==='string'&&a.note.length<=500&&/^\d{4}-\d{2}-\d{2}$/.test(a.date)&&/^(0[8-9]|1[0-9]|2[0-1]):00$/.test(a.time)&&!Number.isNaN(Date.parse(a.createdAt))&&['pending','confirmed','completed','cancelled'].includes(a.status);
  if(ok)seen.add(a.id);return ok;});if(valid.length!==raw.length)storage.recover('appointments',valid);return valid;};
 const write=all=>storage.write('appointments',all);
 const change=(id,status)=>{const all=read(),a=all.find(x=>x.id===id);if(!a)throw new Error('预约不存在');a.status=nextStatus(a.status,status);write(all);return a;};
 return {getReminderConfig:async()=>({enabled:false,templateId:'',reason:'演示模式，微信提醒未启用'}),subscribeReminder:async()=>{throw new Error('演示模式不会发送微信提醒');},adminCheckSetup:async()=>({cloudConnected:false,adminAllowed:false,reminderEnabled:false,reason:'演示模式：未连接真实云环境'}),async createAppointment(input){const all=read(),old=all.find(a=>a.requestId===input.requestId);if(old)return old;const product=await catalog.getProduct(input.productId),a=buildAppointment(input,{now:now(),product,owner:'demo',id:'demo-'+input.requestId});
  const current=read(),existing=current.find(x=>x.requestId===a.requestId);if(existing)return existing;write(current.concat(a));return a;},
  listMyAppointments:async()=>read().slice().reverse(),cancelAppointment:async id=>change(id,'cancelled'),adminListAppointments:async()=>read().slice().reverse(),adminSetAppointmentStatus:async p=>change(p.id,p.status),clear:()=>storage.remove('appointments')};
}
module.exports={createAppointmentService};
