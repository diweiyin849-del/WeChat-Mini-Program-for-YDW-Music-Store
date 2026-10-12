function readReminderConfig(env){
 const off=reason=>({enabled:false,templateId:'',fields:{},state:'trial',reason});
 const templateId=env.APPOINTMENT_TEMPLATE_ID;
 if(typeof templateId!=='string'||! /^[A-Za-z0-9_-]{1,128}$/.test(templateId))return off('微信提醒未配置有效模板 ID');
 const state=env.APPOINTMENT_MESSAGE_STATE;
 if(!['developer','trial','formal'].includes(state))return off('请配置消息跳转的小程序版本');
 let fields;try{fields=JSON.parse(env.APPOINTMENT_TEMPLATE_FIELDS);}catch(e){return off('请配置实际模板字段映射');}
 if(!fields||Array.isArray(fields)||typeof fields!=='object'||Object.keys(fields).length!==3)return off('模板需包含乐器、预约时间、门店三个字段');
 const sources=new Set();
 for(const [key,value] of Object.entries(fields)){
  if(!value||!['product','dateTime','store'].includes(value.source)||sources.has(value.source)||!['thing','time','character_string'].includes(value.type)||!new RegExp('^'+value.type+'[1-9][0-9]*$').test(key))return off('模板字段名称、类型或来源不匹配');
  if(value.source==='dateTime'?value.type!=='time':value.type!=='thing')return off('预约时间使用 time 字段，乐器和门店使用 thing 字段');
  sources.add(value.source);
 }
 return {enabled:true,templateId,state,fields,reason:''};
}
module.exports={readReminderConfig};
