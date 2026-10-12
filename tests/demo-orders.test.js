const test=require('node:test'),assert=require('node:assert/strict');
const {buildDemoOrder,applyDemoPayment,changeDemoOrderStatus}=require('../miniprogram/domain/demo-orders');
const products=[{id:'g',title:'吉他',status:'active',shippingType:'normal',images:['g.png'],skus:[{id:'s',label:'标准',priceFen:68000,stock:5}]}];
const shop={shipping:{localFen:0,regionalFen:10000,pianoFen:30000}};
const address={contact:'张女士',phone:'13800000000',provinceCode:'650000',cityCode:'650500',districtCode:'650502',detail:'1号',regionNames:['美国','纽约','区']};
const input={requestId:'r',lines:[{skuId:'s',quantity:1,expectedPriceFen:68000}],fulfillment:'pickup',contact:'张女士',phone:'+12125551234',expectedTotalFen:68000,desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}};
const make=(i=input,p=products)=>buildDemoOrder(i,{products:p,shop,id:'demo-r',now:'2026-10-12T00:00:00Z'});
test('order snapshots canonical price and validates totals, contacts, quantities and delivery',()=>{
 const o=make({...input,title:'伪造'});assert.equal(o.totalFen,68000);assert.equal(o.items[0].title,'吉他');assert.equal(o.shippingFen,0);
 for(const patch of [{expectedTotalFen:1},{contact:''},{phone:'123'},{lines:[{skuId:'s',quantity:0,expectedPriceFen:68000}]},{requestId:'../r'}])assert.throws(()=>make({...input,...patch}));
 assert.equal(make({...input,fulfillment:'delivery',address}).totalFen,68000);
 const other={...address,cityCode:'650100',districtCode:'650102'};
 assert.equal(make({...input,fulfillment:'delivery',address:other,expectedTotalFen:78000}).shippingFen,10000);
 const piano=[{...products[0],shippingType:'piano'}];
 assert.equal(make({...input,fulfillment:'delivery',address:other,expectedTotalFen:98000},piano).shippingFen,30000);
 assert.throws(()=>make({...input,fulfillment:'delivery',address:other}));
 assert.throws(()=>make({...input,fulfillment:'delivery',address:{...address,detail:'x'.repeat(201)}}));
 products[0].title='改名';assert.equal(o.items[0].title,'吉他');products[0].title='吉他';
});
test('payment failure/cancel do not deduct and successful payment is idempotent at fixed price',()=>{
 const o=make();for(const outcome of ['failure','cancel']){const r=applyDemoPayment(o,products,outcome,'now');assert.equal(r.order.status,'pending');assert.equal(r.products[0].skus[0].stock,5);}
 const reprice=JSON.parse(JSON.stringify(products));reprice[0].skus[0].priceFen=90000;
 const paid=applyDemoPayment(o,reprice,'success','now');assert.equal(paid.order.totalFen,68000);assert.equal(paid.products[0].skus[0].stock,4);
 assert.equal(applyDemoPayment(paid.order,paid.products,'success','later').products[0].skus[0].stock,4);
 for(const p of [[{...products[0],status:'inactive'}],[{...products[0],skus:[{...products[0].skus[0],stock:0}]}]])assert.throws(()=>applyDemoPayment(o,p,'success','now'));
 assert.equal(products[0].skus[0].stock,5);
});
test('status transitions enforce actor and delivery and terminal states',()=>{
 const pending=make();delete pending.desiredTime;const paid=applyDemoPayment(pending,products,'success','now').order;
 assert.equal(changeDemoOrderStatus(pending,'cancelled','customer','now').status,'cancelled');
 assert.throws(()=>changeDemoOrderStatus(pending,'shipped','admin','now'));
 assert.throws(()=>changeDemoOrderStatus(paid,'shipped','admin','now'));
 assert.throws(()=>changeDemoOrderStatus(paid,'completed','customer','now'));
 const done=changeDemoOrderStatus(paid,'completed','admin','now');assert.throws(()=>applyDemoPayment(done,products,'success','now'));
 const delivery=make({...input,fulfillment:'delivery',address});
 delete delivery.desiredTime;
 const shipped=changeDemoOrderStatus(applyDemoPayment(delivery,products,'success','now').order,'shipped','admin','now');
 assert.equal(changeDemoOrderStatus(shipped,'completed','customer','now').status,'completed');
 assert.throws(()=>changeDemoOrderStatus(done,'cancelled','admin','now'));
});
