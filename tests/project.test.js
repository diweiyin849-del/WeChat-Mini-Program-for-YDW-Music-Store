const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const {checkProject}=require('../scripts/check-project');
const root=path.resolve(__dirname,'..');
test('allRegisteredPagesExist and native project passes checker',()=>{assert.deepEqual(checkProject(root),[]);});
test('checker rejects missing pages and payment paths in controlled project',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'heqisheng-check-'));
 try{fs.mkdirSync(path.join(tmp,'miniprogram'),{recursive:true});fs.writeFileSync(path.join(tmp,'miniprogram','app.json'),JSON.stringify({pages:['pages/missing/index']}));
  fs.writeFileSync(path.join(tmp,'miniprogram','bad.js'),'wx.requestPayment({})');
  const errors=checkProject(tmp);assert.ok(errors.some(x=>x.includes('缺少页面')));assert.ok(errors.some(x=>x.includes('支付')));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('cloud package can execute its handlers and dependencies resolve',()=>{
 execFileSync(process.execPath,['scripts/package-cloud.js'],{cwd:root});
 const {createHandlers}=require('../cloudfunctions/store/server/handlers');
 assert.equal(typeof createHandlers,'function');
 const result=spawnSync(process.execPath,['--check','cloudfunctions/store/index.js'],{cwd:root});assert.equal(result.status,0);
});
test('checker accepts explicitly named demo code but rejects direct merchant transport and server orders',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'heqisheng-scope-'));
 try{fs.mkdirSync(path.join(tmp,'miniprogram'),{recursive:true});fs.mkdirSync(path.join(tmp,'server'));fs.writeFileSync(path.join(tmp,'miniprogram','app.json'),'{"pages":[]}');
 fs.writeFileSync(path.join(tmp,'miniprogram','demo-orders.js'),'function createDemoOrder() {}');assert.deepEqual(checkProject(tmp),[]);
 fs.writeFileSync(path.join(tmp,'miniprogram','real.js'),"const url='https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';");assert.ok(checkProject(tmp).some(x=>x.includes('支付')));
 fs.writeFileSync(path.join(tmp,'server','orders.js'),'function createOrder() {}');assert.ok(checkProject(tmp).some(x=>x.includes('server')));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
