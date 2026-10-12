const test=require('node:test');
const assert=require('node:assert/strict');
const {memoryPlatform}=require('./helpers');
const {createStorage}=require('../miniprogram/services/storage');
const {createCartService}=require('../miniprogram/services/cart');
const {createAddressService}=require('../miniprogram/services/address');
const address={id:'a',contact:'张女士',phone:'13800000000',provinceCode:'650000',cityCode:'650500',districtCode:'650502',regionNames:['美国','纽约市','伊州区'],detail:'演示地址1号',isDefault:true};
test('cartPersistsAndRejectsInvalidQuantity',()=>{
  const s=createStorage(memoryPlatform()),cart=createCartService(s);cart.setQuantity('sku-demo',2);
  assert.equal(createCartService(s).getLines()[0].quantity,2);
  for(const n of [-1,0,1.5,NaN,Infinity]) assert.throws(()=>cart.setQuantity('sku-demo',n));
  cart.setSelected('sku-demo',false);assert.equal(cart.getLines()[0].selected,false);
  cart.remove('sku-demo');assert.deepEqual(cart.getLines(),[]);
});
test('addressesHaveOneDefault and deleting it promotes another',()=>{
  const service=createAddressService(createStorage(memoryPlatform()));
  service.save(address);service.save({...address,id:'b',isDefault:true});
  assert.deepEqual(service.list().filter(a=>a.isDefault).map(a=>a.id),['b']);
  service.remove('b');assert.equal(service.list()[0].isDefault,true);
  assert.throws(()=>service.save({...address,phone:'abc'}));
});
test('corruptStorageResetsSafely',()=>{
  const p=memoryPlatform(),warnings=[],s=createStorage(p,m=>warnings.push(m));
  p.setStorageSync('heqisheng.preview.v1.cart','broken');
  assert.deepEqual(createCartService(s).getLines(),[]);assert.equal(warnings.length,1);
  p.setStorageSync('heqisheng.preview.v1.cart',{version:1,data:[{skuId:'x',quantity:-1}]});
  assert.deepEqual(createCartService(s).getLines(),[]);
  p.setStorageSync('heqisheng.preview.v1.addresses',{version:77,data:[]});
  assert.deepEqual(createAddressService(s).list(),[]);
});
test('clearOnlyShopKeys',()=>{
  const p=memoryPlatform(),s=createStorage(p);p.setStorageSync('unrelated',7);
  const cart=createCartService(s),addresses=createAddressService(s);cart.setQuantity('x',1);addresses.save(address);
  cart.clear();addresses.clear();assert.equal(p.getStorageSync('unrelated'),7);assert.deepEqual(addresses.list(),[]);
});
test('valid envelope with corrupt payload recovers and warns',()=>{
 const platform=memoryPlatform(),warnings=[],s=createStorage(platform,m=>warnings.push(m));
 platform.setStorageSync('heqisheng.preview.v1.cart',{version:1,data:{not:'a cart'}});
 assert.deepEqual(createCartService(s).getLines(),[]);assert.equal(warnings.length,1);
 platform.setStorageSync('heqisheng.preview.v1.addresses',{version:1,data:[{...address,contact:7,detail:{}}]});
 assert.deepEqual(createAddressService(s).list(),[]);assert.equal(warnings.length,2);
 assert.throws(()=>createAddressService(s).save({...address,contact:7}));
});
test('restored addresses deduplicate and repair missing or multiple defaults',()=>{
 const platform=memoryPlatform(),s=createStorage(platform);
 platform.setStorageSync('heqisheng.preview.v1.addresses',{version:1,data:[{...address,isDefault:false},{...address,id:'b',isDefault:false},{...address,isDefault:false}]});
 const a=createAddressService(s).list();assert.equal(a.length,2);assert.equal(a.filter(x=>x.isDefault).length,1);
 platform.setStorageSync('heqisheng.preview.v1.addresses',{version:1,data:[address,{...address,id:'b'}]});
 assert.equal(createAddressService(s).list().filter(x=>x.isDefault).length,1);
});
test('address rejects city and district mismatch',()=>{
 const a=createAddressService(createStorage(memoryPlatform()));assert.throws(()=>a.save({...address,districtCode:'650102'}));
});
