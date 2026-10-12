const test=require('node:test'),assert=require('node:assert/strict');
function fixture(){
 const docs=new Map([['appointments:a-1',{id:'a-1',owner:'u1',status:'pending',productTitle:'吉他',date:'2026-11-01',time:'08:00'}]]);let chain=Promise.resolve();
 const db={collection(name){return {doc(id){return {async get(){return {data:docs.has(name+':'+id)?{...docs.get(name+':'+id),_id:id}:null};},async set({data}){assert.ok(!('_id' in data));docs.set(name+':'+id,structuredClone(data));}};},where(q){return {limit(){return {async get(){return {data:[...docs.entries()].filter(([k])=>k===name+':'+q._id).map(([,v])=>structuredClone(v))};}};}};}};},runTransaction(fn){const p=chain.then(()=>fn(db));chain=p.catch(()=>{});return p;}};
 return {docs,repo:require('../server/reminder-repository').createReminderRepository({database:()=>db})};
}
module.exports={fixture};
