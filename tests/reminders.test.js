const test=require('node:test'),assert=require('node:assert/strict');
const config={enabled:true,templateId:'T',state:'trial',fields:{thing1:{source:'product',type:'thing'},time2:{source:'dateTime',type:'time'},thing3:{source:'store',type:'thing'}}};
test('reminder service sends only canonical recipient and handles success and uncertain outcomes',async()=>{
 const {fixture}=require('./reminder-fixture'),{createReminderService}=require('../server/reminders');
 for(const [response,want] of [[{errCode:0},'accepted'],[{errCode:43101},'failed'],[{},'unknown'],[new Error('timeout'),'unknown']]){
  const {repo,docs}=fixture();let message;
  const svc=createReminderService({repository:repo,config,send:async m=>{message=m;if(response instanceof Error)throw response;return response;},getShop:async()=>({name:'和齐升琴行'})});
  await svc.subscribe({id:'a-1',templateId:'T',owner:'attacker'}, {openid:'u1'});docs.get('appointments:a-1').status='confirmed';docs.get('appointments:a-1').productTitle='琴'.repeat(50);
  assert.equal(await svc.sendConfirmation('a-1'),want);assert.equal(message.touser,'u1');assert.equal(message.data.thing1.value.length,20);assert.equal(message.data.time2.value,'2026-11-01 08:00');assert.equal(message.page,'pages/appointments/index');assert.ok(!JSON.stringify(message).includes('phone'));
 }
});
test('old records skip sends and mismatched templates reject',async()=>{
 const {fixture}=require('./reminder-fixture'),{createReminderService}=require('../server/reminders');const {repo,docs}=fixture();let sends=0;
 const svc=createReminderService({repository:repo,config,send:async()=>{sends++;return {errCode:0};},getShop:async()=>({name:'琴行'})});
 await assert.rejects(()=>svc.subscribe({id:'a-1',templateId:'OTHER'},{openid:'u1'}));docs.get('appointments:a-1').status='confirmed';assert.equal(await svc.sendConfirmation('a-1'),'skipped');assert.equal(sends,0);
});
test('changed template exposes actionable labels for pending and confirmed old intent',()=>{
 const {reminderLabel}=require('../miniprogram/utils/reminder');const a={status:'pending',reminderStatus:'none',confirmationReminder:{templateId:'OLD'}};
 assert.match(reminderLabel(a,false,{enabled:true,templateId:'NEW'}),/重新开启/);
 assert.match(reminderLabel({...a,status:'confirmed'},false,{enabled:true,templateId:'NEW'}),/未发送/);
});
test('legacy shop name is YDW in a newly constructed confirmation message',async()=>{
 const {fixture}=require('./reminder-fixture'),{createReminderService}=require('../server/reminders'),{repo,docs}=fixture();let message;
 const svc=createReminderService({repository:repo,config,send:async m=>{message=m;return {errCode:0};},getShop:async()=>({name:'和齐升琴行'})});
 await svc.subscribe({id:'a-1',templateId:'T'},{openid:'u1'});docs.get('appointments:a-1').status='confirmed';await svc.sendConfirmation('a-1');assert.equal(message.data.thing3.value,'YDW琴行');
});
