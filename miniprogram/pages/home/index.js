const {services,productView,load}=require('../../utils/ui');
const {getCategorySummaries}=require('../../domain/catalog');
const {contactShop}=require('../../utils/contact');
Page({data:{categories:[],products:[],shop:{},keys:[1,2,3,4,5,6,7,8,9],demo:false,loading:false,error:''},
 onShow(){this.refresh();},refresh(){return load(this,async current=>{const s=services();const [categories,products,shop]=await Promise.all([s.catalog.listCategories(),s.catalog.listProducts({}),s.catalog.getShop()]);if(current())this.setData({categories:getCategorySummaries(categories,products),products:products.filter(p=>p.featured).map(productView),shop,demo:getApp().globalData.mode==='demo'});});},
 openProduct(e){wx.navigateTo({url:'/pages/product/index?id='+encodeURIComponent(e.detail.id)});},call(){contactShop(this.data.shop);},
 browse(){wx.switchTab({url:'/pages/categories/index'});},chooseCategory(e){services().storage.write('browse-category',e.currentTarget.dataset.id);this.browse();}
});
