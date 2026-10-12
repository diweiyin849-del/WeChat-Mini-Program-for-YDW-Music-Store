const {services,money,load,toast}=require('../../utils/ui');
const {createQuoteController}=require('../../view-models/checkout');
Page({data:{demo:false,desiredDate:'',desiredHour:'',dateOptions:[],hourOptions:[],submitting:false,saved:false,fulfillment:'delivery',address:null,shop:null,quote:null,quoteLoading:false,error:'',loading:false,contact:'',phone:'',priceChanged:false},
 selectDate(e){this.setData({desiredDate:this.data.dateOptions[Number(e.detail.value)]||''});},selectHour(e){this.setData({desiredHour:this.data.hourOptions[Number(e.detail.value)]||''});},
 onLoad(o){this.active=true;this.setData({demo:getApp().globalData.mode==='demo'});this.singleSku=o.skuId||'';this.expectedPrices={};const n=Number(o.expectedPriceFen);if(this.singleSku&&Number.isSafeInteger(n)&&n>0)this.expectedPrices[this.singleSku]=n;},
 onUnload(){this.active=false;this.loadSequence=(this.loadSequence||0)+1;if(this.controller)this.controller.invalidate();},
 async submitDemoOrder(){
  if(this.active===false||this.data.submitting||this.data.loading||this.data.quoteLoading||this.data.saved)return;
  if(getApp().globalData.mode!=='demo')return toast('模拟订单仅在演示模式可用');
  if(!this.data.quote||!this.data.quote.valid)return toast('请先确认有效费用');
  if(!this.data.desiredDate||!this.data.desiredHour)return toast('请选择纽约门店当地的期望交付时间');
  const input={lines:(this.lines||[]).map(l=>({skuId:l.skuId,quantity:l.quantity,expectedPriceFen:this.expectedPrices[l.skuId]})),fulfillment:this.data.fulfillment,address:this.data.address,contact:this.data.contact,phone:this.data.phone,expectedTotalFen:this.data.quote.totalFen,fromCart:!this.singleSku,desiredTime:{date:this.data.desiredDate,time:this.data.desiredHour,timeZone:'America/New_York'}};
  const signature=JSON.stringify(input);if(signature!==this.submitSignature){this.submitSignature=signature;this.requestId='r'+Date.now()+'-'+Math.random().toString(36).slice(2,10);}
  this.setData({submitting:true});try{const o=await services().orders.submit({...input,requestId:this.requestId});if(this.active!==false){this.setData({saved:true});wx.navigateTo({url:'/pages/demo-payment/index?id='+encodeURIComponent(o.id)});}}
  catch(e){if(this.active!==false){toast(e);await this.requote();}}finally{if(this.active!==false)this.setData({submitting:false});}
 },
 initController(catalog){this.controller=createQuoteController(catalog,state=>{
   const q=state.quote;this.setData({quoteLoading:state.loading,error:state.error,quote:q?{...q,items:q.items.map(i=>({...i,priceText:money(i.priceFen),lineText:money(i.lineTotalFen)})),subtotalText:money(q.subtotalFen),shippingText:money(q.shippingFen),totalText:money(q.totalFen)}:null,priceChanged:!!q&&q.issues.some(i=>i.code==='PRICE_CHANGED')});
 });},
 onShow(){return this.refresh();},refresh(){if(this.controller)this.controller.invalidate();this.setData({quote:null,quoteLoading:false,priceChanged:false});return load(this,async current=>{
   const s=services();if(!this.controller)this.initController(s.catalog);const [products,shop]=await Promise.all([s.catalog.listProducts({}),s.catalog.getShop()]);if(!current())return;
   this.lines=this.singleSku?[{skuId:this.singleSku,quantity:1}]:s.cart.getLines().filter(l=>l.selected);
   for(const l of this.lines){if(this.expectedPrices[l.skuId]===undefined&&Number.isSafeInteger(l.expectedPriceFen))this.expectedPrices[l.skuId]=l.expectedPriceFen;
     for(const p of products){const sku=p.skus.find(k=>k.id===l.skuId);if(sku&&this.expectedPrices[l.skuId]===undefined)this.expectedPrices[l.skuId]=sku.priceFen;}}
   const all=s.addresses.list(),selected=s.storage.read('selected-address','');const address=all.find(a=>a.id===selected)||all.find(a=>a.isDefault)||null;
   this.setData({address,shop});if(this.data.demo){const options=await s.orders.fulfillmentOptions();if(!current())return;this.setData({dateOptions:options.dates,hourOptions:options.times});}await this.requote();
 });},
 requote(){if(!this.controller)return Promise.resolve();const a=this.data.address;return this.controller.update({lines:(this.lines||[]).map(l=>({skuId:l.skuId,quantity:l.quantity,expectedPriceFen:this.expectedPrices[l.skuId]})),fulfillment:this.data.fulfillment,region:a?{provinceCode:a.provinceCode,cityCode:a.cityCode,districtCode:a.districtCode}:null});},
 fulfillment(e){this.setData({fulfillment:e.currentTarget.dataset.value});this.requote();},
 chooseAddress(){wx.navigateTo({url:'/pages/addresses/index?select=1'});},
 contact(e){this.setData({[e.currentTarget.dataset.field]:e.detail.value});},
 acceptPrices(){if(!this.data.quote)return;for(const i of this.data.quote.items){this.expectedPrices[i.skuId]=i.priceFen;if(!this.singleSku){const l=services().cart.getLines().find(l=>l.skuId===i.skuId);if(l)services().cart.setQuantity(l.skuId,l.quantity,i.priceFen);}}return this.requote();},
 browse(){wx.switchTab({url:'/pages/categories/index'});},cart(){wx.switchTab({url:'/pages/cart/index'});}
});
