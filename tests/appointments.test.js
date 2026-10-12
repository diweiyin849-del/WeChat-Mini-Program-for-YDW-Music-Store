const test=require('node:test'),assert=require('node:assert/strict');
const seed=require('../miniprogram/data/demo-catalog'),product=seed.products.find(p=>p.id==='demo-guitar');
const now=new Date('2026-10-11T23:00:00Z');
const input={requestId:'r1',productId:product.id,skuId:product.skus[0].id,date:'2026-10-12',time:'08:00',contact:'顾客',phone:'+12125550123',note:''};
test('appointments validate New York calendar, time window, contact and active product',()=>{
 const {validateAppointment,storeClock}=require('../miniprogram/domain/appointments');
 assert.equal(storeClock(new Date('2026-10-12T02:00:00Z')).date,'2026-10-11');
 assert.equal(validateAppointment(input,{now,product}).phone,'+12125550123');
 for(const bad of [{date:'2026-02-30'},{date:'2026-10-11'},{date:'2026-11-12'},{time:'22:00'},{time:'08:30'},{contact:''},{phone:'123456'},{note:'x'.repeat(501)},{skuId:'missing'}])assert.throws(()=>validateAppointment({...input,...bad},{now,product}));
 assert.throws(()=>validateAppointment(input,{now,product:{...product,status:'inactive'}}));
});
test('partial Intl implementation shows clear unsupported timezone feedback',()=>{
 const old=Intl.DateTimeFormat;Intl.DateTimeFormat=function(){return {};};
 try{assert.throws(()=>require('../miniprogram/domain/appointments').storeClock(now),/不支持纽约时区/);}finally{Intl.DateTimeFormat=old;}
});
test('demo appointments persist, retry once and enforce terminal states',async()=>{
 const {createAppointmentService}=require('../miniprogram/services/appointments');
 const {createStorage}=require('../miniprogram/services/storage'),{memoryPlatform}=require('./helpers');
 const storage=createStorage(memoryPlatform()),catalog={getProduct:async()=>product};
 const make=()=>createAppointmentService({},storage,'demo',catalog,{now:()=>now});
 const s=make(),a=await s.createAppointment(input),b=await s.createAppointment(input);assert.equal(a.id,b.id);assert.equal((await make().listMyAppointments()).length,1);
 await s.adminSetAppointmentStatus({id:a.id,status:'confirmed'});await s.adminSetAppointmentStatus({id:a.id,status:'completed'});
 await assert.rejects(()=>s.cancelAppointment(a.id));assert.equal((await s.listMyAppointments())[0].status,'completed');
 s.clear();assert.deepEqual(await s.listMyAppointments(),[]);
});
test('cloud appointment failure does not create local success',async()=>{
 const {createAppointmentService}=require('../miniprogram/services/appointments');
 const storage=require('../miniprogram/services/storage').createStorage(require('./helpers').memoryPlatform());
 const s=createAppointmentService({cloud:{callFunction:async()=>{throw new Error('断网');}}},storage,'cloud',{});
 await assert.rejects(()=>s.createAppointment(input),/断网/);assert.deepEqual(storage.read('appointments',[]),[]);
});
test('corrupt local appointment payload recovers instead of showing incomplete customer records',async()=>{
 const storage=require('../miniprogram/services/storage').createStorage(require('./helpers').memoryPlatform());
 storage.write('appointments',[null,{id:'bad',status:'pending',productTitle:'missing details'}]);
 const s=require('../miniprogram/services/appointments').createAppointmentService({},storage,'demo',{});
 assert.deepEqual(await s.listMyAppointments(),[]);
});
module.exports={input,now};
