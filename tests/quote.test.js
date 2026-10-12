const test=require('node:test'),assert=require('node:assert/strict');
const {calculateShipping}=require('../miniprogram/domain/shipping');
const {buildQuote}=require('../miniprogram/domain/quote');
const shipping={localFen:0,regionalFen:10000,pianoFen:30000};
const region={provinceCode:'650000',cityCode:'650500',districtCode:'650502'};
const products=[{id:'a',title:'吉他',status:'active',shippingType:'normal',skus:[{id:'g',label:'标准',priceFen:68000,stock:2}]},
 {id:'b',title:'钢琴',status:'active',shippingType:'piano',skus:[{id:'p',label:'标准',priceFen:1000000,stock:2}]}];
const shop={shipping};
const input={lines:[{skuId:'g',quantity:1,expectedPriceFen:68000}],fulfillment:'delivery',region};
test('shippingMatrix',()=>{
 const cases=[['delivery',region,false,0],['delivery',{...region,cityCode:'650100',districtCode:'650102'},false,10000],['delivery',region,true,30000],
 ['delivery',{...region,cityCode:'650100',districtCode:'650102'},true,30000],['pickup',null,true,0]];
 for(const [fulfillment,r,hasPiano,want]of cases)assert.equal(calculateShipping({fulfillment,region:r,hasPiano,shipping}).shippingFen,want);
 assert.equal(calculateShipping({fulfillment:'delivery',region:{provinceCode:'110000',cityCode:'110100',districtCode:'110101'},hasPiano:false,shipping}).shippingFen,20000);
 assert.equal(calculateShipping({fulfillment:'invalid',region,hasPiano:false,shipping}).supported,false);
});
test('mixed and multiple pianos charge once; digital piano uses normal rate',()=>{
 const quote=buildQuote({input:{...input,lines:[...input.lines,{skuId:'p',quantity:2,expectedPriceFen:1000000}]},products,shop});
 assert.equal(quote.shippingFen,30000);assert.equal(quote.totalFen,2098000);
 const digital=[{...products[0],categoryId:'digital-piano'}];
 assert.equal(buildQuote({input,products:digital,shop}).shippingFen,0);
});
test('quoteRevalidatesCatalog and does not mutate stock',()=>{
 const before=JSON.stringify(products);
 assert.equal(buildQuote({input,products,shop}).totalFen,68000);assert.equal(JSON.stringify(products),before);
 for(const [items,lines,code]of [
  [[{...products[0],status:'inactive'}],input.lines,'SKU_UNAVAILABLE'],
  [products,[{skuId:'removed',quantity:1,expectedPriceFen:1}],'SKU_UNAVAILABLE'],
  [products,[{skuId:'g',quantity:3,expectedPriceFen:68000}],'INSUFFICIENT_STOCK'],
  [products,[{skuId:'g',quantity:-1,expectedPriceFen:68000}],'INVALID_QUANTITY'],
  [products,[{skuId:'g',quantity:1,expectedPriceFen:1}],'PRICE_CHANGED']]){
   const q=buildQuote({input:{...input,lines},products:items,shop});assert.equal(q.valid,false);assert.equal(q.totalFen,null);assert.equal(q.issues[0].code,code);
 }
});
test('incompleteRegionIsRejected and duplicate quantities cannot bypass stock',()=>{
 const q=buildQuote({input:{...input,region:{provinceCode:'650000'}},products,shop});assert.equal(q.valid,false);assert.equal(q.shippingFen,null);
 assert.equal(buildQuote({input:{...input,lines:[input.lines[0],{...input.lines[0],quantity:2}]},products,shop}).issues[0].code,'INSUFFICIENT_STOCK');
 assert.equal(buildQuote({input:{...input,lines:[]},products,shop}).valid,false);
});
test('shipping rejects mismatched region and supports direct-admin county selection',()=>{
 assert.equal(calculateShipping({fulfillment:'delivery',region:{...region,districtCode:'650102'},hasPiano:false,shipping}).supported,false);
 for(const r of [{provinceCode:'650000',cityCode:'659000',districtCode:'659001'},{provinceCode:'650000',cityCode:'659001',districtCode:'659001'}])assert.equal(calculateShipping({fulfillment:'delivery',region:r,hasPiano:false,shipping}).shippingFen,10000);
 assert.equal(calculateShipping({fulfillment:'delivery',region:{provinceCode:'650000',cityCode:'659001',districtCode:'659002'},hasPiano:false,shipping}).supported,false);
});
