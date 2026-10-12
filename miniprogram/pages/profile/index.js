const {services,load,toast}=require('../../utils/ui');
const {contactShop,serviceNotes}=require('../../utils/contact');
Page({data:{shop:null,serviceNotes,admin:false,demo:false,showPrivacy:false,loading:false,error:''},onShow(){return this.refresh();},refresh(){return load(this,async current=>{const c=services().catalog,[shop,access]=await Promise.all([c.getShop(),c.getAdminAccess()]);if(current())this.setData({shop,admin:access.allowed,demo:!!access.demo});});},
 care(){wx.navigateTo({url:'/pages/care/index'});},
 orders(){if(getApp().globalData.mode==='demo')wx.navigateTo({url:'/pages/demo-orders/index'});},
 addresses(){wx.navigateTo({url:'/pages/addresses/index'});},admin(){if(this.data.admin)wx.navigateTo({url:'/pages/admin/index'});},privacy(){this.setData({showPrivacy:!this.data.showPrivacy});},
 call(){contactShop(this.data.shop);},
 appointments(){wx.navigateTo({url:'/pages/appointments/index'});},favorites(){wx.navigateTo({url:'/pages/saved/index?mode=favorites'});},compare(){wx.navigateTo({url:'/pages/saved/index?mode=compare'});},
 clear(){wx.showModal({title:'清除本机购物数据',content:'将清空购物车、收货地址、收藏、对比清单、本机演示预约、模拟订单和选中的地址。保留商品资料，不会恢复已扣减库存。',success:r=>{if(r.confirm){try{const s=services();s.orders.clear();s.cart.clear();s.addresses.clear();s.selections.clear();s.appointments.clear();s.storage.remove('selected-address');toast('本机购物数据已清除');}catch(e){toast(e);}}}});}
});
