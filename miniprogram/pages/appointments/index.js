const {services,load,toast}=require('../../utils/ui');
const {requestReminder,reminderLabel}=require('../../utils/reminder');
const labels={pending:'待确认',confirmed:'已确认',completed:'已完成',cancelled:'已取消'};
Page({data:{admin:false,demo:false,allowed:false,items:[],reminderConfig:{enabled:false,reason:'微信提醒未启用'},subscribingId:'',loading:false,error:''},
 onLoad(o){this.active=true;this.setData({admin:o.admin==='1',demo:getApp().globalData.mode==='demo'});},
 onShow(){return this.refresh();},onUnload(){this.active=false;this.loadSequence=(this.loadSequence||0)+1;},
 refresh(){if(this.active===false)return Promise.resolve();this.setData({allowed:false});return load(this,async current=>{
  const s=services();if(this.data.admin){const a=await s.catalog.getAdminAccess();if(!a.allowed)throw new Error('仅琴行管理员可查看预约');}
  const rows=await(this.data.admin?s.appointments.adminListAppointments():s.appointments.listMyAppointments());
  let config={enabled:false,reason:'暂时无法读取微信提醒配置'};try{config=await s.appointments.getReminderConfig();}catch(e){}
  if(current()&&this.active!==false)this.setData({allowed:true,reminderConfig:config,items:rows.map(a=>({...a,statusLabel:labels[a.status]+(this.data.demo?'（演示）':''),reminderLabel:reminderLabel(a,this.data.demo,config),canEnableReminder:a.status==='pending'&&(!a.confirmationReminder||a.confirmationReminder.templateId!==config.templateId),canCancel:a.status==='pending'||a.status==='confirmed'}))});
 });},
 async enableReminder(e){
  if(this.active===false||this.changing||this.subscribing||this.data.admin)return;
  const id=e.currentTarget.dataset.id,a=this.data.items.find(x=>x.id===id),c=this.data.reminderConfig;
  if(!a||a.status!=='pending')return toast('仅待确认预约可以开启提醒');
  if(this.data.demo||!c.enabled)return toast(c.reason||'微信提醒未启用');
  if(c.templateId!==getApp().globalData.appointmentTemplateId)return toast('提醒模板配置不一致，请联系琴行');
  this.subscribing=true;this.setData({subscribingId:id});
  try{
   const r=await requestReminder(wx,c.templateId);if(this.active===false)return;
   if(!r.accepted)return toast('未开启提醒，预约仍可正常使用');
   await services().appointments.subscribeReminder({id,templateId:c.templateId});if(this.active===false)return;
   await this.refresh();if(this.active!==false)toast('已登记提醒意愿');
  }catch(e){if(this.active!==false)toast(e);}finally{this.subscribing=false;if(this.active!==false)this.setData({subscribingId:''});}
 },
 async status(e){if(this.changing||this.subscribing||this.active===false)return;const {id,status}=e.currentTarget.dataset;this.changing=true;
  try{const r=this.data.admin?await services().appointments.adminSetAppointmentStatus({id,status}):await services().appointments.cancelAppointment(id);if(this.active===false)return;await this.refresh();if(this.active!==false)toast(status==='confirmed'&&r.reminderStatus&&['failed','unknown','sending'].includes(r.reminderStatus)?'预约已确认，请查看提醒状态':'预约状态已更新');}
  catch(e){if(this.active!==false)toast(e);}finally{this.changing=false;}
 },
 cancel(e){const id=e.currentTarget.dataset.id;wx.showModal({title:'取消试琴预约',content:'确认取消这次预约？',success:r=>{if(r.confirm&&this.active!==false)this.status({currentTarget:{dataset:{id,status:'cancelled'}}});}});}
});
