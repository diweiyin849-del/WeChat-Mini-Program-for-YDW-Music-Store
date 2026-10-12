const {error}=require('./permissions');
const {normalizeShop}=require('../miniprogram/domain/shop-config');
function buildMessage(a,shop,c){
 const values={product:a.productTitle,dateTime:a.date+' '+a.time,store:shop&&normalizeShop(shop).name},data={};
 for(const [key,f] of Object.entries(c.fields)){
  let v=values[f.source];if(typeof v!=='string'||!v.trim())throw error('INVALID_REMINDER','提醒内容尚未配置');v=v.replace(/[\r\n\t]/g,' ').trim();
  if(f.type==='thing')v=Array.from(v).slice(0,20).join('');
  else if(f.type==='time'){if(!/^\d{4}-\d{2}-\d{2} (0[8-9]|1[0-9]|2[0-1]):00$/.test(v))throw error('INVALID_REMINDER','预约时间无效');}
  else throw error('INVALID_REMINDER','模板字段类型尚不支持');
  data[key]={value:v};
 }
 return {touser:a.owner,templateId:c.templateId,page:'pages/appointments/index',miniprogramState:c.state,lang:'zh_CN',data};
}
function createReminderService({repository,config,send,getShop,now}){
 const clock=()=>now?now():new Date();
 return {
  config:()=>({enabled:config.enabled,templateId:config.enabled?config.templateId:'',reason:config.reason||''}),
  async subscribe(p,identity){if(!config.enabled)throw error('NOT_CONFIGURED',config.reason||'微信提醒未启用');if(!identity.openid)throw error('FORBIDDEN','请先登录');if(p.templateId!==config.templateId)throw error('INVALID_REMINDER','提醒模板配置不一致');return repository.subscribe({id:p.id,owner:identity.openid,templateId:config.templateId});},
  status:id=>repository.getStatus(id),checkConnection:()=>repository.checkConnection(),
  async sendConfirmation(id){
   if(!config.enabled)return 'disabled';
   const claim=await repository.claim({id,templateId:config.templateId,now:clock()});if(!claim.claimed)return claim.status;
   let status='unknown',code='UNCONFIRMED';
   try{
    const a=await repository.getAppointment(id);
    if(!a||a.status!=='confirmed'||a.owner!==claim.appointment.owner||!a.confirmationReminder||a.confirmationReminder.templateId!==config.templateId){status='failed';code='NO_LONGER_CONFIRMED';}
    else{
     const message=buildMessage(a,await getShop(),config),r=await send(message);
     if(r&&r.errCode===0){status='accepted';code='0';}
     else if(r&&Number.isInteger(r.errCode)&&r.errCode>0){status='failed';code=String(r.errCode);}
    }
   }catch(e){if(e.code==='INVALID_REMINDER'){status='failed';code='INVALID_CONTENT';}else if(Number.isInteger(e.errCode)&&e.errCode>0){status='failed';code=String(e.errCode);}}
   try{await repository.finish({id,status,code,now:clock()});}catch(e){return 'unknown';}
   return status;
  }
 };
}
module.exports={createReminderService};
