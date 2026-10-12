const test=require('node:test'),assert=require('node:assert/strict');
const {createHandlers}=require('../server/handlers');
test('successful confirmation survives notification error and diagnoses only for admins',async()=>{
 let record={id:'a-1',owner:'u',status:'pending'};
 const repository={isAdmin:async id=>id==='admin',transitionAppointment:async p=>{record={...record,status:p.status};return record;}};
 const reminders={sendConfirmation:async()=>{throw new Error('private key detail');},config:()=>({enabled:false,reason:'未配置'}),checkConnection:async()=>true};
 const admin=createHandlers({repository,identity:{openid:'admin'},reminders});
 const r=await admin.handle('adminSetAppointmentStatus',{id:'a-1',status:'confirmed'});assert.equal(r.status,'confirmed');assert.equal(r.reminderStatus,'unknown');
 assert.equal((await admin.handle('adminCheckAppointmentSetup')).cloudConnected,true);
 const customer=createHandlers({repository,identity:{openid:'u'},reminders});await assert.rejects(()=>customer.handle('adminCheckAppointmentSetup'));await assert.rejects(()=>customer.handle('adminSetAppointmentStatus',{id:'a-1',status:'confirmed'}));
});
test('cloud service never falls back to demo on unavailable reminder server',async()=>{
 const s=require('../miniprogram/services/appointments').createAppointmentService({cloud:{callFunction:async()=>{throw new Error('offline');}}},{},'cloud',{});
 await assert.rejects(()=>s.subscribeReminder({id:'a-1',templateId:'T'}),/offline/);
});
