const test=require('node:test'),assert=require('node:assert/strict');
const {memoryPlatform}=require('./helpers');
const {createStorage}=require('../miniprogram/services/storage');
const {createCartService}=require('../miniprogram/services/cart');
const {createAddressService}=require('../miniprogram/services/address');
const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
function setup(catalogOverride){
 const wx=memoryPlatform(),storage=createStorage(wx),nav=[];
 Object.assign(wx,{showToast:()=>{},navigateTo:o=>nav.push(o.url),redirectTo:o=>nav.push(o.url),switchTab:o=>nav.push(o.url),navigateBack:()=>nav.push('back'),showModal:o=>o.success({confirm:true})});
 const app={globalData:{mode:'demo'},services:{storage,cart:createCartService(storage),addresses:createAddressService(storage),catalog:createDemoCatalog(storage,wx),selections:require('../miniprogram/services/selections').createSelectionService(storage)}};
 if(catalogOverride)app.services.catalog=catalogOverride;
 app.services.appointments=require('../miniprogram/services/appointments').createAppointmentService(wx,storage,'demo',app.services.catalog);
 app.services.orders=require('../miniprogram/services/demo-orders').createDemoOrderService({mode:'demo',commerce:app.services.catalog.demoCommerce,readShop:app.services.catalog.demoShop,cart:app.services.cart,now:()=> '2026-10-12T16:30:00Z'});
 global.wx=wx;global.getApp=()=>app;
 return {app,nav,page(name){let definition;global.Page=p=>{definition=p;};const path=require.resolve('../miniprogram/pages/'+name+'/index');delete require.cache[path];require(path);
   const page={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(values){for(const [key,v]of Object.entries(values)){const parts=key.replace(/\[(\d+)\]/g,'.$1').split('.');let target=this.data;for(const part of parts.slice(0,-1))target=target[part];target[parts.at(-1)]=v;}}};return page;}};
}
test('checkout requires selected NY time, merchant can adjust and customer sees confirmation',async()=>{
 const s=setup(),p=s.page('checkout');p.onLoad({skuId:'sku-guitar-standard',expectedPriceFen:'68000'});await p.onShow();p.fulfillment({currentTarget:{dataset:{value:'pickup'}}});await p.requote();p.setData({contact:'顾客',phone:'13800000000'});await p.submitDemoOrder();assert.equal((await s.app.services.orders.list()).length,0);
 p.selectDate({detail:{value:1}});p.selectHour({detail:{value:2}});await p.submitDemoOrder();const o=(await s.app.services.orders.list())[0];assert.equal(o.desiredTime.date,'2026-10-13');assert.equal(o.desiredTime.time,'10:00');
 await s.app.services.orders.pay({id:o.id,outcome:'success'});const admin=s.page('demo-order');admin.onLoad({id:o.id,admin:'1'});await admin.onShow();admin.setData({confirmDate:'2026-10-14',confirmHour:'11:00'});await Promise.all([admin.confirmTime(),admin.confirmTime()]);
 const customer=s.page('demo-order');customer.onLoad({id:o.id});await customer.onShow();assert.equal(customer.data.order.confirmedTime.date,'2026-10-14');assert.equal(customer.data.order.status,'paid');
});
test('time confirmation awaiting permissions has no effect after page unload',async()=>{
 const s=setup(),p=s.page('demo-order');p.onLoad({id:'demo-old',admin:'1'});let resolve,shown=[];global.wx.showToast=o=>shown.push(o.title);s.app.services.catalog.getAdminAccess=()=>new Promise(r=>resolve=r);let calls=0;s.app.services.orders.adminConfirmTime=async()=>{calls++;};
 p.setData({order:{status:'paid',desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}},confirmDate:'2026-10-13',confirmHour:'10:00'});const pending=p.confirmTime();p.onUnload();resolve({allowed:true,demo:true});await pending;assert.equal(calls,0);assert.deepEqual(shown,[]);
});
test('order filters persist on refresh and reset restores snapshot search results',async()=>{
 const s=setup(),input={requestId:'filter-a',lines:[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:68000}],fulfillment:'pickup',contact:'张三',phone:'13800000000',expectedTotalFen:68000,desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}};
 const a=await s.app.services.orders.submit(input);await s.app.services.orders.pay({id:a.id,outcome:'success'});await s.app.services.orders.submit({...input,requestId:'filter-b',contact:'李四'});
 const p=s.page('demo-orders');p.onLoad({});await p.onShow();p.inputQuery({detail:{value:'张三'}});await p.selectStatus({currentTarget:{dataset:{value:'paid'}}});assert.equal(p.data.items.length,1);await p.refresh();assert.equal(p.data.items.length,1);await p.resetFilters();assert.equal(p.data.items.length,2);
});
test('merchant sees per-SKU stock alerts and can save editable threshold and international rates',async()=>{
 const s=setup(),product=await s.app.services.catalog.getProduct('demo-guitar');product.skus[0].stock=1;await s.app.services.catalog.adminSaveProduct(product);
 const p=s.page('admin');await p.refresh();assert.equal(p.data.lowStock.length,1);assert.equal(p.data.lowStock[0].skuId,'sku-guitar-standard');
 p.setData({'shopForm.lowStockThresholdText':'0','shopForm.internationalYuan':'250','shopForm.internationalPianoYuan':'650'});await p.saveShop();assert.equal(p.data.lowStock.length,0);assert.equal((await s.app.services.catalog.getShop()).shipping.internationalFen,25000);
});
test('checkout submits only selected quantities once and payment failure/cancel can retry',async()=>{
 const s=setup();s.app.services.cart.setQuantity('sku-guitar-standard',2,68000);s.app.services.cart.setQuantity('other',1,1);s.app.services.cart.setSelected('other',false);
 const p=s.page('checkout');p.onLoad({});await p.onShow();p.fulfillment({currentTarget:{dataset:{value:'pickup'}}});await p.requote();p.setData({contact:'顾客',phone:'+12125551234'});
 p.setData({desiredDate:'2026-10-13',desiredHour:'10:00'});await Promise.all([p.submitDemoOrder(),p.submitDemoOrder()]);const list=await s.app.services.orders.list();assert.equal(list.length,1);assert.equal(list[0].items[0].quantity,2);assert.equal(list[0].totalFen,136000);
 const pay=s.page('demo-payment');pay.onLoad({id:list[0].id});await pay.onShow();
 await pay.pay({currentTarget:{dataset:{outcome:'failure'}}});assert.equal((await s.app.services.orders.get(list[0].id)).status,'pending');
 await pay.pay({currentTarget:{dataset:{outcome:'cancel'}}});assert.equal((await s.app.services.orders.get(list[0].id)).status,'pending');
 await pay.pay({currentTarget:{dataset:{outcome:'success'}}});assert.equal((await s.app.services.orders.get(list[0].id)).status,'paid');assert.deepEqual(s.app.services.cart.getLines().map(x=>x.skuId),['other']);
 const detail=s.page('demo-order');detail.onLoad({id:list[0].id,admin:'1'});await detail.onShow();await detail.confirmTime();await detail.status({currentTarget:{dataset:{status:'completed'}}});assert.equal((await s.app.services.orders.get(list[0].id)).status,'completed');
});
test('simulation pages reject cloud, and unloaded payment shows no stale feedback',async()=>{
 const s=setup(),p=s.page('demo-payment');s.app.globalData.mode='cloud';p.onLoad({id:'demo-x'});await p.onShow();assert.match(p.data.error,/演示/);
 s.app.globalData.mode='demo';const next=s.page('demo-payment');next.onLoad({id:'demo-x'});next.setData({order:{status:'pending'}});let resolve,shown=[];
 global.wx.showToast=o=>shown.push(o.title);s.app.services.orders.pay=()=>new Promise(r=>resolve=r);const pending=next.pay({currentTarget:{dataset:{outcome:'success'}}});next.onUnload();resolve({order:{id:'demo-x',status:'paid'},cartCleanupFailed:true});await pending;assert.deepEqual(shown,[]);assert.deepEqual(s.nav,[]);
});
test('retrying cancelled payment replaces screens without accumulating navigation entries',async()=>{
 const s=setup(),o=await s.app.services.orders.submit({requestId:'retry-nav',lines:[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:68000}],fulfillment:'pickup',contact:'顾客',phone:'12125551234',expectedTotalFen:68000,desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}});
 let pushes=0,replaces=0;global.wx.navigateTo=()=>{pushes++;};global.wx.redirectTo=()=>{replaces++;};
 for(let n=0;n<12;n++){const p=s.page('demo-payment');p.onLoad({id:o.id});await p.onShow();await p.pay({currentTarget:{dataset:{outcome:'cancel'}}});const d=s.page('demo-order');d.onLoad({id:o.id});await d.onShow();d.pay();}
 assert.equal(pushes,0);assert.equal(replaces,24);assert.equal((await s.app.services.orders.get(o.id)).status,'pending');
});
test('opening appointments never asks subscription and rejects mismatched template',async()=>{
 const s=setup(),p=s.page('appointments');let calls=0;global.wx.requestSubscribeMessage=()=>{calls++;};s.app.globalData.appointmentTemplateId='client-T';
 s.app.services.appointments.getReminderConfig=async()=>({enabled:true,templateId:'server-T'});p.onLoad({});await p.onShow();assert.equal(calls,0);
 p.setData({items:[{id:'a1',status:'pending'}]});await p.enableReminder({currentTarget:{dataset:{id:'a1'}}});assert.equal(calls,0);
});
test('reminder refusal does not save intent and accepted save failures remain failures',async()=>{
 const s=setup(),p=s.page('appointments');s.app.globalData.appointmentTemplateId='T';s.app.globalData.mode='cloud';let saves=0,shown=[];
 global.wx.showToast=o=>shown.push(o.title);s.app.services.appointments.getReminderConfig=async()=>({enabled:true,templateId:'T'});
 s.app.services.appointments.subscribeReminder=async()=>{saves++;throw new Error('保存失败');};p.onLoad({});await p.onShow();p.setData({items:[{id:'a1',status:'pending'}]});
 global.wx.requestSubscribeMessage=o=>o.success({T:'reject'});await p.enableReminder({currentTarget:{dataset:{id:'a1'}}});assert.equal(saves,0);
 global.wx.requestSubscribeMessage=o=>o.success({T:'accept'});await p.enableReminder({currentTarget:{dataset:{id:'a1'}}});assert.equal(saves,1);assert.ok(shown.includes('保存失败'));assert.ok(!shown.includes('已登记提醒意愿'));
});
test('repeated reminder clicks and leaving page cannot duplicate requests or show stale feedback',async()=>{
 const s=setup(),p=s.page('appointments');s.app.globalData.mode='cloud';s.app.globalData.appointmentTemplateId='T';let callback,calls=0,shown=[];global.wx.showToast=o=>shown.push(o.title);
 s.app.services.appointments.getReminderConfig=async()=>({enabled:true,templateId:'T'});p.onLoad({});await p.onShow();p.setData({items:[{id:'a1',status:'pending'}]});
 global.wx.requestSubscribeMessage=o=>{calls++;callback=o.success;};s.app.services.appointments.subscribeReminder=async()=>{throw new Error('should not save after unload');};
 const a=p.enableReminder({currentTarget:{dataset:{id:'a1'}}});await p.enableReminder({currentTarget:{dataset:{id:'a1'}}});assert.equal(calls,1);p.onUnload();callback({T:'accept'});await a;assert.deepEqual(shown,[]);
});
test('pending old-template intent allows explicit reauthorization using current template',async()=>{
 const s=setup(),p=s.page('appointments');s.app.globalData.mode='cloud';s.app.globalData.appointmentTemplateId='NEW';let saved;
 const a={id:'a1',status:'pending',confirmationReminder:{templateId:'OLD'}};s.app.services.appointments.listMyAppointments=async()=>[a];s.app.services.appointments.getReminderConfig=async()=>({enabled:true,templateId:'NEW'});
 s.app.services.appointments.subscribeReminder=async x=>{saved=x;};global.wx.requestSubscribeMessage=o=>o.success({NEW:'accept'});
 p.onLoad({});await p.onShow();assert.equal(p.data.items[0].canEnableReminder,true);await p.enableReminder({currentTarget:{dataset:{id:'a1'}}});assert.deepEqual(saved,{id:'a1',templateId:'NEW'});
});
test('native product page adds chosen SKU and navigates to preview',async()=>{
 const s=setup();const product=await s.app.services.catalog.getProduct('demo-guitar');product.skus=[product.skus[0],{id:'sku-guitar-custom',productId:product.id,label:'套装',priceFen:88000,stock:3}];await s.app.services.catalog.adminSaveProduct(product);
 const p=s.page('product');await p.onLoad({id:'demo-guitar'});await p.refresh();p.selectSku({currentTarget:{dataset:{index:1}}});p.add();
 assert.equal(s.app.services.cart.getLines()[0].skuId,'sku-guitar-custom');p.preview();assert.ok(s.nav[0].includes('checkout/index?skuId=sku-guitar-custom'));
});
test('product care link preserves category and care page handles missing category offline',async()=>{
 const s=setup(),p=s.page('product');await p.onLoad({id:'demo-guitar'});p.care();assert.equal(s.nav.at(-1),'/pages/care/index?categoryId=guitar');
 const guide=s.page('care');guide.onLoad({categoryId:'guitar'});assert.equal(guide.data.guide.title,'吉他');
 guide.onLoad({categoryId:'unknown'});assert.ok(guide.data.error);guide.all();assert.equal(guide.data.guides.length,8);
});
test('native checkout defaults to no address and pickup recalculates without order',async()=>{
 const s=setup();s.app.services.cart.setQuantity('sku-guitar-standard',1);const p=s.page('checkout');p.onLoad({});await p.refresh();
 assert.equal(p.data.quote.valid,false);assert.equal(p.data.quote.issues[0].code,'INCOMPLETE_ADDRESS');p.fulfillment({currentTarget:{dataset:{value:'pickup'}}});await p.requote();
 assert.equal(p.data.quote.totalFen,68000);assert.equal(s.app.services.cart.getLines()[0].quantity,1);
});
test('native admin rejects permission failure without exposing demo controls',async()=>{
 const s=setup({getAdminAccess:async()=>({allowed:false})}),p=s.page('admin');await p.refresh();assert.equal(p.data.allowed,false);assert.match(p.data.error,/管理员/);
});

test('demo appointment page saves selected SKU once and admin can confirm it',async()=>{
 const s=setup(),p=s.page('appointment');await p.onLoad({productId:'demo-guitar',skuId:'sku-guitar-standard'});
 p.setData({contact:'顾客',phone:'+12125550123'});await Promise.all([p.submit(),p.submit()]);
 const list=await s.app.services.appointments.listMyAppointments();assert.equal(list.length,1);assert.equal(list[0].skuId,'sku-guitar-standard');assert.equal(p.data.saved,true);assert.equal(p.data.demo,true);
 const admin=s.page('appointments');admin.onLoad({admin:'1'});await admin.onShow();await admin.status({currentTarget:{dataset:{id:list[0].id,status:'confirmed'}}});
 assert.equal((await s.app.services.appointments.listMyAppointments())[0].status,'confirmed');
});
test('leaving appointment list prevents stale status failure feedback on the next screen',async()=>{
 const s=setup(),p=s.page('appointments');p.onLoad({});let reject,shown=[];
 global.wx.showToast=o=>shown.push(o.title);s.app.services.appointments.cancelAppointment=()=>new Promise((resolve,r)=>{reject=r;});
 const pending=p.status({currentTarget:{dataset:{id:'old',status:'cancelled'}}});p.onUnload();reject(new Error('旧请求失败'));await pending;
 assert.deepEqual(shown,[]);
});

test('category price and beginner filters reset without changing category totals',async()=>{
 const s=setup(),p=s.page('categories');p.setData({categoryId:'guitar',minYuan:'',maxYuan:'1000',beginnerOnly:true,inStockOnly:true});await p.refresh();
 assert.equal(p.data.products.length,2);assert.equal(p.data.categories.find(c=>c.id==='guitar').modelCount,5);
 await p.resetFilters();assert.equal(p.data.products.length,5);
 p.setData({minYuan:'200',maxYuan:'100'});await p.refresh();assert.match(p.data.error,/最低价/);
});

test('product favorites and comparison show latest catalog data after admin price changes',async()=>{
 const s=setup(),p=s.page('product');await p.onLoad({id:'demo-guitar'});p.favorite();p.addCompare();
 assert.deepEqual(s.app.services.selections.favorites(),['demo-guitar']);assert.deepEqual(s.app.services.selections.comparison(),['demo-guitar']);
 const product=await s.app.services.catalog.getProduct('demo-guitar');product.skus[0].priceFen=79999;Object.assign(product,await s.app.services.catalog.adminSaveProduct(product));
 const list=s.page('saved');list.onLoad({mode:'compare'});await list.onShow();assert.equal(list.data.products[0].priceText,'799.99');
 product.status='inactive';await s.app.services.catalog.adminSaveProduct(product);await list.refresh();assert.equal(list.data.products[0].unavailable,true);
 list.remove({currentTarget:{dataset:{id:'demo-guitar'}}});await list.refresh();assert.equal(list.data.products.length,0);
 assert.deepEqual(s.app.services.selections.favorites(),['demo-guitar']);
});

test('product inquiry identifies selected instrument and copies demo contact rather than dialing placeholder',async()=>{
 const s=setup(),p=s.page('product');await p.onLoad({id:'demo-guitar'});await p.refresh();
 let modal,copied,called=false;
 global.wx.showModal=o=>{assert.ok(Array.from(o.confirmText).length<=4,'native modal confirmText cannot exceed 4 characters');modal=o;o.success({confirm:true});};
 global.wx.setClipboardData=o=>{copied=o.data;};global.wx.makePhoneCall=()=>{called=true;};
 p.consult();
 assert.match(modal.content,/HQS-G-01/);assert.match(copied,/123456/);assert.match(copied,/8:00-22:00/);assert.match(copied,/纽约/);assert.match(copied,/预约到店试琴/);
 assert.equal(called,false);
});

test('failed consultation modal shows a visible error rather than silently doing nothing',async()=>{
 const s=setup(),p=s.page('product');await p.onLoad({id:'demo-guitar'});let message;
 global.wx.showToast=o=>{message=o.title;};global.wx.showModal=o=>o.fail({errMsg:'showModal:fail'});
 p.consult();assert.match(message,/咨询.*失败|无法.*咨询/);
});

test('product inquiry with configured telephone dials only after confirmation',async()=>{
 const s=setup(),p=s.page('product');
 const shop=await s.app.services.catalog.getShop();await s.app.services.catalog.adminSaveShop({...shop,phone:'13800000000'});
 await p.onLoad({id:'demo-guitar'});await p.refresh();let confirm,number;
 global.wx.showModal=o=>{confirm=o.success;};global.wx.makePhoneCall=o=>{number=o.phoneNumber;};
 p.consult();assert.equal(number,undefined);confirm({confirm:true});assert.equal(number,'13800000000');
});

test('updated shipping rates do not conflict with legacy demo delivery descriptions',async()=>{
 const s=setup(),product=await s.app.services.catalog.getProduct('demo-guitar');
 product.deliveryDescription='美国境内配送，纽约市免费，其他城市预览运费100元。';await s.app.services.catalog.adminSaveProduct(product);
 const shop=await s.app.services.catalog.getShop();await s.app.services.catalog.adminSaveShop({...shop,shipping:{...shop.shipping,regionalFen:15000}});
 const p=s.page('product');await p.onLoad({id:product.id});
 assert.equal(p.data.shop.shipping.regionalFen,15000);
 assert.equal(typeof p.data.deliveryNote,'string');assert.doesNotMatch(p.data.deliveryNote,/100元|免费/);
});
test('native admin saves edited price and preserves SKU inventory',async()=>{
 const s=setup(),p=s.page('admin');await p.refresh();p.editProduct({currentTarget:{dataset:{id:'demo-guitar'}}});
 p.skuInput({currentTarget:{dataset:{index:0,field:'priceYuan'}},detail:{value:'799.99'}});await p.saveProduct();
 const result=await s.app.services.catalog.getProduct('demo-guitar');assert.equal(result.skus[0].priceFen,79999);assert.equal(result.skus[0].stock,5);
});
test('price change from selected product survives cart navigation to checkout',async()=>{
 const s=setup(),p=s.page('product');p.onLoad({id:'demo-guitar'});await p.refresh();p.add();
 const changed=await s.app.services.catalog.getProduct('demo-guitar');changed.skus[0].priceFen=79999;await s.app.services.catalog.adminSaveProduct(changed);
 const checkout=s.page('checkout');checkout.onLoad({});await checkout.refresh();
 assert.equal(checkout.data.quote.valid,false);assert.ok(checkout.data.quote.issues.some(i=>i.code==='PRICE_CHANGED'));
 checkout.acceptPrices();await checkout.requote();assert.ok(!checkout.data.quote.issues.some(i=>i.code==='PRICE_CHANGED'));
});
test('direct preview retains price seen on product page',async()=>{
 const s=setup(),p=s.page('product');p.onLoad({id:'demo-guitar'});await p.refresh();
 const changed=await s.app.services.catalog.getProduct('demo-guitar');changed.skus[0].priceFen=79999;await s.app.services.catalog.adminSaveProduct(changed);p.preview();
 const params=Object.fromEntries(new URL('https://example.test'+s.nav.at(-1)).searchParams);
 const checkout=s.page('checkout');checkout.onLoad(params);await checkout.refresh();assert.ok(checkout.data.quote.issues.some(i=>i.code==='PRICE_CHANGED'));
});
test('failed checkout refresh invalidates previously valid quote',async()=>{
 const s=setup();s.app.services.cart.setQuantity('sku-guitar-standard',1);const p=s.page('checkout');p.onLoad({});await p.refresh();p.fulfillment({currentTarget:{dataset:{value:'pickup'}}});await p.requote();assert.equal(p.data.quote.valid,true);
 s.app.services.catalog.listProducts=async()=>{throw new Error('断网');};await p.refresh();assert.equal(p.data.quote,null);assert.equal(p.data.error,'断网');
});
test('cart can decrement toward reduced stock one step at a time',async()=>{
 const s=setup();s.app.services.cart.setQuantity('sku-guitar-standard',5);const product=await s.app.services.catalog.getProduct('demo-guitar');product.skus[0].stock=1;await s.app.services.catalog.adminSaveProduct(product);
 const p=s.page('cart');await p.refresh();p.change({currentTarget:{dataset:{id:'sku-guitar-standard',delta:-1}}});assert.equal(s.app.services.cart.getLines()[0].quantity,4);
});
test('pending image upload cannot attach to a different editor',async()=>{
 const s=setup(),p=s.page('admin');await p.refresh();p.editProduct({currentTarget:{dataset:{id:'demo-guitar'}}});
 let resolveUpload;global.wx.chooseImage=o=>o.success({tempFilePaths:['a.jpg']});s.app.services.catalog.adminUploadImage=()=>new Promise(r=>{resolveUpload=r;});
 p.upload();p.closeForm();p.editProduct({currentTarget:{dataset:{id:'demo-violin'}}});resolveUpload({fileId:'image-A'});await new Promise(r=>setImmediate(r));
 assert.deepEqual(p.data.form.images,(await s.app.services.catalog.getProduct('demo-violin')).images);assert.equal(p.data.uploading,false);
});

test('category totals refresh after admin edits and remain independent of search',async()=>{
 const s=setup(),p=s.page('categories');await p.refresh();
 assert.equal(p.data.categories.find(c=>c.id==='guitar').stockCount,25);
 const product=await s.app.services.catalog.getProduct('demo-guitar');product.skus[0].stock=1;await s.app.services.catalog.adminSaveProduct(product);
 p.setData({categoryId:'guitar',keyword:'no-match'});await p.refresh();
 assert.equal(p.data.products.length,0);
 assert.equal(p.data.categories.find(c=>c.id==='guitar').modelCount,5);
 assert.equal(p.data.categories.find(c=>c.id==='guitar').stockCount,21);
});
test('cloud startup errors are caught in category and checkout lifecycles',async()=>{
 const s=setup();s.app.startupError='请先配置云开发环境';
 const categories=s.page('categories');await categories.onShow();assert.equal(categories.data.error,'请先配置云开发环境');
 const checkout=s.page('checkout');checkout.onLoad({});await checkout.refresh();assert.equal(checkout.data.error,'请先配置云开发环境');
 assert.doesNotThrow(()=>checkout.fulfillment({currentTarget:{dataset:{value:'pickup'}}}));
});
test('older category failure cannot overwrite newer success',async()=>{
 const s=setup(),p=s.page('categories');const pending=[];
 s.app.services.catalog.listProducts=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));
 const old=p.refresh(),latest=p.refresh();pending[1].resolve([]);await latest;pending[0].reject(new Error('old request failed'));await old;
 assert.equal(p.data.error,'');assert.equal(p.data.loading,false);
});
