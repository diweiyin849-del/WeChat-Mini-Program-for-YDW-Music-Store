const cloud=require('wx-server-sdk');
const {createHandlers}=require('./server/handlers');
const {createCloudRepository}=require('./server/cloud-repository');
const {createReminderRepository}=require('./server/reminder-repository');
const {readReminderConfig}=require('./server/reminder-config');
const {createReminderService}=require('./server/reminders');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async event=>{
 try{const context=cloud.getWXContext(),repository=createCloudRepository(cloud);
  const lazy={};for(const name of ['subscribe','claim','finish','getStatus','getAppointment','checkConnection'])lazy[name]=(...args)=>createReminderRepository(cloud)[name](...args);
  const reminders=createReminderService({repository:lazy,config:readReminderConfig(process.env),send:message=>cloud.openapi.subscribeMessage.send(message),getShop:()=>repository.getShop()});
  const handlers=createHandlers({repository,identity:{openid:context.OPENID},reminders});
  return {ok:true,data:await handlers.handle(event&&event.action,event&&event.payload)};
 }catch(e){return {ok:false,error:{code:e.code||'SERVICE_ERROR',message:e.code?e.message:'服务暂不可用，请检查云端配置或稍后重试'}};}
};
