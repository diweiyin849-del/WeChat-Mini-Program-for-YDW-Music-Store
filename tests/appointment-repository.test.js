const test=require('node:test'),assert=require('node:assert/strict');
test('cloud repository creates once under concurrent retry and atomically checks owner and state',async()=>{
 const docs=new Map(),audit=[];let chain=Promise.resolve();
 const db={collection(name){return {doc(id){return {async get(){const v=docs.get(name+':'+id);return {data:v?{...v,_id:id}:null};},async set({data}){if('_id' in data)throw new Error('reserved _id is not writable');docs.set(name+':'+id,JSON.parse(JSON.stringify(data)));}};},async add({data}){audit.push(data);}};},runTransaction(fn){const p=chain.then(()=>fn(db));chain=p.catch(()=>{});return p;}};
 const repo=require('../server/cloud-repository').createCloudRepository({database:()=>db});
 const record={id:'a-1',owner:'userA',status:'pending',requestId:'r1'};
 await Promise.all([repo.createAppointmentOnce(record),repo.createAppointmentOnce(record)]);assert.equal(docs.size,1);
 await assert.rejects(()=>repo.transitionAppointment({id:'a-1',actor:'userB',admin:false,status:'cancelled'}));
 await repo.transitionAppointment({id:'a-1',actor:'admin',admin:true,status:'confirmed'});assert.equal(audit.length,1);
 await repo.transitionAppointment({id:'a-1',actor:'userA',admin:false,status:'cancelled'});assert.equal(docs.get('appointments:a-1').status,'cancelled');
 await assert.rejects(()=>repo.transitionAppointment({id:'a-1',actor:'admin',admin:true,status:'completed'}));
});
