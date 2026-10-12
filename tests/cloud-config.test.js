const test=require('node:test'),assert=require('node:assert/strict');
test('static cloud checks distinguish demo, missing env and manual deployment',()=>{
 const {validateCloudConfig}=require('../miniprogram/domain/cloud-config');
 assert.equal(validateCloudConfig({mode:'demo',appId:'touristappid'}).ready,false);
 const p={mode:'cloud',appId:'wx1234567890abcdef',cloudEnv:'env-real',templateId:'T_real',rules:{read:false,write:false},cloudFunctionConfig:{permissions:{openapi:['subscribeMessage.send']}}};
 assert.equal(validateCloudConfig({...p,cloudEnv:''}).ready,false);
 const r=validateCloudConfig(p);assert.equal(r.ready,true);assert.ok(r.manualChecks.length>0);
});
test('reminder config disables absent, malformed and mismatched field mappings',()=>{
 const {readReminderConfig}=require('../server/reminder-config');
 const env={APPOINTMENT_TEMPLATE_ID:'T_real',APPOINTMENT_MESSAGE_STATE:'trial',APPOINTMENT_TEMPLATE_FIELDS:JSON.stringify({thing1:{source:'product',type:'thing'},time2:{source:'dateTime',type:'time'},thing3:{source:'store',type:'thing'}})};
 assert.equal(readReminderConfig({}).enabled,false);assert.equal(readReminderConfig(env).enabled,true);
 for(const changed of [{APPOINTMENT_TEMPLATE_FIELDS:'{'},{APPOINTMENT_MESSAGE_STATE:'oops'},{APPOINTMENT_TEMPLATE_FIELDS:JSON.stringify({thing1:{source:'product',type:'thing'},time2:{source:'product',type:'time'}})},{APPOINTMENT_TEMPLATE_FIELDS:JSON.stringify({thing1:{source:'product',type:'time'},time2:{source:'dateTime',type:'time'},thing3:{source:'store',type:'thing'}})}])assert.equal(readReminderConfig({...env,...changed}).enabled,false);
});
