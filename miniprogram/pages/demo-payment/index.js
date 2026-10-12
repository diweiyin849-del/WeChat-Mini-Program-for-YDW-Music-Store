const {services,money,load,toast}=require('../../utils/ui');
Page({data:{order:null,loading:false,error:'',paying:false},
 onLoad(o){this.active=true;this.id=o.id||'';},
 onUnload(){this.active=false;this.loadSequence=(this.loadSequence||0)+1;},
 onShow(){return this.refresh();},
 refresh(){return load(this,async current=>{if(getApp().globalData.mode!=='demo')throw Error('模拟订单仅在演示模式可用');const o=await services().orders.get(this.id);if(current()&&this.active!==false)this.setData({order:{...o,totalText:money(o.totalFen)}});});},
 async pay(e){if(this.active===false||this.data.paying||!this.data.order)return;if(getApp().globalData.mode!=='demo')return toast('模拟订单仅在演示模式可用');this.setData({paying:true});
  try{const r=await services().orders.pay({id:this.id,outcome:e.currentTarget.dataset.outcome});if(this.active===false)return;
   if(r.cartCleanupFailed)toast('模拟付款成功，购物车清理失败，请手动检查');
   if(e.currentTarget.dataset.outcome==='failure'){toast('模拟付款失败，可以重试');await this.refresh();}
   else wx.redirectTo({url:'/pages/demo-order/index?id='+encodeURIComponent(this.id)});
  }catch(e){if(this.active!==false)toast(e);}finally{if(this.active!==false)this.setData({paying:false});}
 },detail(){wx.redirectTo({url:'/pages/demo-order/index?id='+encodeURIComponent(this.id)});}
});
