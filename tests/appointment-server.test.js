const test=require('node:test'),assert=require('node:assert/strict');
const seed=require('../miniprogram/data/demo-catalog');
test('appointment server ignores forged owner, deduplicates and isolates customer records',async()=>{
 const {createAppointmentHandlers}=require('../server/appointments'),{nextStatus}=require('../miniprogram/domain/appointments');
 const all=new Map(),repo={getProduct:async id=>seed.products.find(p=>p.id===id),isAdmin:async id=>id==='admin',getAppointment:async id=>all.get(id),listAppointments:async owner=>[...all.values()].filter(a=>!owner||a.owner===owner),createAppointmentOnce:async a=>{if(!all.has(a.id))all.set(a.id,a);return all.get(a.id);},transitionAppointment:async p=>{const a=all.get(p.id);if(!a||(!p.admin&&a.owner!==p.actor))throw new Error('无权限');a.status=nextStatus(a.status,p.status);return a;}};
 const make=openid=>createAppointmentHandlers({repository:repo,identity:{openid},now:()=>new Date('2026-10-11T23:00:00Z')});
 const input={requestId:'r1',productId:'demo-guitar',skuId:'sku-guitar-standard',date:'2026-10-12',time:'08:00',contact:'顾客',phone:'+12125550123',owner:'forged',status:'completed'};
 const a=await make('A').handle('createAppointment',input),b=await make('A').handle('createAppointment',input);assert.equal(a.id,b.id);assert.equal(a.owner,'A');assert.equal(a.status,'pending');
 assert.deepEqual(await make('B').handle('listMyAppointments'),[]);
 await assert.rejects(()=>make('B').handle('cancelAppointment',{id:a.id}));
 await assert.rejects(()=>make('A').handle('adminSetAppointmentStatus',{id:a.id,status:'confirmed'}));
 await make('admin').handle('adminSetAppointmentStatus',{id:a.id,status:'confirmed'});
 await make('A').handle('cancelAppointment',{id:a.id});assert.equal(a.status,'cancelled');
 await assert.rejects(()=>make('admin').handle('adminSetAppointmentStatus',{id:a.id,status:'completed'}));
 await assert.rejects(()=>make('').handle('listMyAppointments'));
});
