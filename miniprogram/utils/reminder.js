function requestReminder(platform,templateId){
 return new Promise((resolve,reject)=>{
  if(typeof platform.requestSubscribeMessage!=='function')return reject(new Error('当前微信环境不支持订阅提醒，请使用真机检查'));
  platform.requestSubscribeMessage({tmplIds:[templateId],success:r=>resolve({accepted:r[templateId]==='accept'}),fail:()=>reject(new Error('微信授权未完成，请稍后重试'))});
 });
}
const labels={none:'未开启确认提醒',disabled:'微信提醒未启用',skipped:'未开启确认提醒',outdated:'模板已更新，此预约未发送提醒',sending:'发送结果未确认',accepted:'微信接口已接受',failed:'发送失败',unknown:'发送结果未确认',unavailable:'暂时无法读取提醒状态'};
function reminderLabel(a,demo,config){
 if(demo)return '演示模式，微信提醒未启用';
 if(a.reminderStatus&&a.reminderStatus!=='none')return labels[a.reminderStatus]||'发送结果未确认';
 if(config&&!config.enabled)return '微信提醒未启用';
 if(a.confirmationReminder&&config&&a.confirmationReminder.templateId!==config.templateId)return a.status==='pending'?'模板已更新，请重新开启提醒':'模板已更新，此预约未发送提醒';
 return a.confirmationReminder?'已登记提醒意愿':'未开启确认提醒';
}
module.exports={requestReminder,reminderLabel};
