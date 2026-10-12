const test=require('node:test'),assert=require('node:assert/strict');
test('cloud entry preserves actionable booking validation errors for the form',async()=>{
 const Module=require('node:module'),old=Module._load;
 const seed=require('../miniprogram/data/demo-catalog');
 const repo={getAppointment:async()=>null,getProduct:async id=>seed.products.find(p=>p.id===id)};
 Module._load=function(name,parent,isMain){if(name==='wx-server-sdk')return {init:()=>{},getWXContext:()=>({OPENID:'customer'}),DYNAMIC_CURRENT_ENV:'test'};if(name==='./server/cloud-repository')return {createCloudRepository:()=>repo};return old.apply(this,arguments);};
 try{const path=require.resolve('../cloudfunctions/store/index');delete require.cache[path];const entry=require(path);
  const date=require('../miniprogram/domain/appointments').appointmentDates(new Date())[0];
  const result=await entry.main({action:'createAppointment',payload:{requestId:'r1',productId:'demo-guitar',skuId:'sku-guitar-standard',date,time:'08:00',contact:'',phone:'123456'}});
  assert.equal(result.ok,false);assert.equal(result.error.code,'INVALID_APPOINTMENT');assert.match(result.error.message,/联系人/);
 }finally{Module._load=old;}
});
