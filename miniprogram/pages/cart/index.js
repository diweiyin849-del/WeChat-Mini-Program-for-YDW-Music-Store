const {services,money,load,toast}=require('../../utils/ui');
const {buildCartView}=require('../../view-models/cart');
Page({data:{items:[],subtotalText:'0.00',canPreview:false,loading:false,error:''},onShow(){this.refresh();},
 refresh(){return load(this,async()=>{const s=services(),products=await s.catalog.listProducts({});const v=buildCartView(s.cart.getLines(),products);this.setData({...v,items:v.items.map(i=>({...i,priceText:money(i.priceFen)})),subtotalText:money(v.subtotalFen)});});},
 toggle(e){try{const s=services(),item=this.data.items.find(i=>i.skuId===e.currentTarget.dataset.id);s.cart.setSelected(item.skuId,!item.selected);this.refresh();}catch(e){toast(e);}},
 change(e){try{const item=this.data.items.find(i=>i.skuId===e.currentTarget.dataset.id),delta=Number(e.currentTarget.dataset.delta),q=item.quantity+delta;if(q<=0)return;if(delta>0&&q>item.stock)return toast('库存不足，无法继续增加');services().cart.setQuantity(item.skuId,q);this.refresh();}catch(e){toast(e);}},
 remove(e){try{services().cart.remove(e.currentTarget.dataset.id);this.refresh();}catch(e){toast(e);}},
 preview(){if(this.data.canPreview)wx.navigateTo({url:'/pages/checkout/index'});},browse(){wx.switchTab({url:'/pages/categories/index'});}
});
