const {services,productView,money,load,toast}=require('../../utils/ui');
const {contactShop,serviceNotes,deliveryNote}=require('../../utils/contact');
Page({data:{product:null,shop:null,serviceNotes,deliveryNote:'',sku:null,selectedIndex:0,loading:false,error:'',imageFailed:false,favorited:false,inComparison:false},
 care(){if(this.data.product)wx.navigateTo({url:'/pages/care/index?categoryId='+encodeURIComponent(this.data.product.categoryId)});},
 onLoad(o){this.id=o.id;return this.refresh();},refresh(){return load(this,async current=>{const c=services().catalog,[p,shop]=await Promise.all([c.getProduct(this.id),c.getShop()]);if(!p)throw new Error('商品已下架或不存在');const i=Math.min(this.data.selectedIndex,p.skus.length-1);if(current())this.setData({product:productView(p),shop,deliveryNote:deliveryNote(p),sku:{...p.skus[i],priceText:money(p.skus[i].priceFen)},selectedIndex:i});});},
 appointment(){if(this.data.product&&this.data.sku)wx.navigateTo({url:'/pages/appointment/index?productId='+encodeURIComponent(this.id)+'&skuId='+encodeURIComponent(this.data.sku.id)});},consult(){if(this.data.product)contactShop(this.data.shop,this.data.product,this.data.sku);},
 onShow(){this.syncSelections();},syncSelections(){try{const s=services().selections;this.setData({favorited:s.favorites().includes(this.id),inComparison:s.comparison().includes(this.id)});}catch(e){toast(e);}},
 favorite(){try{services().selections.toggleFavorite(this.id);this.syncSelections();toast(this.data.favorited?'已收藏':'已取消收藏');}catch(e){toast(e);}},
 addCompare(){try{services().selections.addCompare(this.id);this.syncSelections();toast('已加入对比');}catch(e){toast(e);}},
 compare(){wx.navigateTo({url:'/pages/saved/index?mode=compare'});},
 selectSku(e){const i=Number(e.currentTarget.dataset.index),s=this.data.product.skus[i];this.setData({selectedIndex:i,sku:{...s,priceText:money(s.priceFen)}});},
 add(){try{const s=services(),sku=this.data.sku;const old=s.cart.getLines().find(l=>l.skuId===sku.id);const quantity=(old?old.quantity:0)+1;if(quantity>sku.stock)return toast('库存不足，无法继续增加');s.cart.setQuantity(sku.id,quantity,sku.priceFen);toast('已加入购物车');}catch(e){toast(e);}},
 preview(){if(this.data.sku&&this.data.sku.stock>0)wx.navigateTo({url:'/pages/checkout/index?skuId='+encodeURIComponent(this.data.sku.id)+'&expectedPriceFen='+this.data.sku.priceFen});},
 cart(){wx.switchTab({url:'/pages/cart/index'});},imageError(){this.setData({imageFailed:true});}
});
