const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./reminder-fixture');
test('only owner of pending appointment can record reminder intent',async()=>{
 const {repo,docs}=fixture();await assert.rejects(()=>repo.subscribe({id:'a-1',owner:'u2',templateId:'T'}));
 await repo.subscribe({id:'a-1',owner:'u1',templateId:'T'});assert.equal(docs.get('appointments:a-1').confirmationReminder.templateId,'T');
 docs.get('appointments:a-1').status='cancelled';await assert.rejects(()=>repo.subscribe({id:'a-1',owner:'u1',templateId:'T'}));
});
test('concurrent claims and abandoned sending records cannot resend',async()=>{
 const {repo,docs}=fixture();await repo.subscribe({id:'a-1',owner:'u1',templateId:'T'});docs.get('appointments:a-1').status='confirmed';
 const r=await Promise.all([repo.claim({id:'a-1',templateId:'T'}),repo.claim({id:'a-1',templateId:'T'})]);assert.equal(r.filter(x=>x.claimed).length,1);
 assert.equal((await repo.claim({id:'a-1',templateId:'T'})).claimed,false);assert.equal(await repo.getStatus('a-1'),'sending');
 await repo.finish({id:'a-1',status:'unknown',code:'UNCONFIRMED'});assert.equal(await repo.getStatus('a-1'),'unknown');assert.equal((await repo.claim({id:'a-1',templateId:'T'})).claimed,false);
});
test('authorization racing with confirmation is rejected at transaction boundary',async()=>{
 const {repo,docs}=fixture();docs.get('appointments:a-1').status='confirmed';await assert.rejects(()=>repo.subscribe({id:'a-1',owner:'u1',templateId:'T'}));
 assert.equal(docs.get('appointments:a-1').confirmationReminder,undefined);
});
test('changed template skip is persisted as outdated notification status',async()=>{
 const {repo,docs}=fixture();await repo.subscribe({id:'a-1',owner:'u1',templateId:'OLD'});docs.get('appointments:a-1').status='confirmed';
 const r=await repo.claim({id:'a-1',templateId:'NEW'});assert.equal(r.claimed,false);assert.equal(r.status,'outdated');assert.equal(await repo.getStatus('a-1'),'outdated');
});
