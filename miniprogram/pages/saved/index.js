const {services,productView,load,toast}=require('../../utils/ui');
Page({data:{mode:'favorites',products:[],loading:false,error:''},
 onLoad(o){this.setData({mode:o.mode==='compare'?'compare':'favorites'});},onShow(){return this.refresh();},
 refresh(){return load(this,async current=>{const s=services(),ids=this.data.mode==='compare'?s.selections.comparison():s.selections.favorites();
  const products=await Promise.all(ids.map(async id=>{const p=await s.catalog.getProduct(id);return p?{...productView(p),unavailable:false}:{id,title:'商品已下架或不存在',model:id,unavailable:true};}));
  if(current())this.setData({products});});},
 remove(e){try{const s=services().selections,id=e.currentTarget.dataset.id;if(this.data.mode==='compare')s.removeCompare(id);else s.removeFavorite(id);return this.refresh();}catch(e){toast(e);}},
 addCompare(e){try{services().selections.addCompare(e.currentTarget.dataset.id);toast('已加入对比');}catch(e){toast(e);}},
 compare(){wx.navigateTo({url:'/pages/saved/index?mode=compare'});},
 openProduct(e){wx.navigateTo({url:'/pages/product/index?id='+encodeURIComponent(e.detail.id)});},
 open(e){wx.navigateTo({url:'/pages/product/index?id='+encodeURIComponent(e.currentTarget.dataset.id)});},
 browse(){wx.switchTab({url:'/pages/categories/index'});}
});
