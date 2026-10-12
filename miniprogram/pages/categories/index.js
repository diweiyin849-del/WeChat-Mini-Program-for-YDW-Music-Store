const {services,productView,load}=require('../../utils/ui');
const {filterProducts,getCategorySummaries}=require('../../domain/catalog');
const {parseFilters}=require('../../view-models/filters');
Page({data:{categories:[],products:[],categoryId:'',minYuan:'',maxYuan:'',beginnerOnly:false,inStockOnly:false,keyword:'',sort:'default',sortIndex:0,sortNames:['推荐排序','价格从低到高','价格从高到低'],loading:false,error:''},
 onShow(){return this.refresh(true);},
 refresh(consumePending){return load(this,async current=>{const s=services();if(consumePending===true){const id=s.storage.read('browse-category','');if(id){this.setData({categoryId:id});s.storage.remove('browse-category');}}
   const c=s.catalog;const [categories,all]=await Promise.all([c.listCategories(),c.listProducts({})]);if(current())this.setData({categories:getCategorySummaries(categories,all),products:filterProducts(all,{categoryId:this.data.categoryId,keyword:this.data.keyword,sort:this.data.sort,...parseFilters(this.data)}).map(productView)});});},
 filterInput(e){this.setData({[e.currentTarget.dataset.field]:e.detail.value});},filterSwitch(e){this.setData({[e.currentTarget.dataset.field]:e.detail.value});this.refresh();},resetFilters(){this.setData({minYuan:'',maxYuan:'',beginnerOnly:false,inStockOnly:false});return this.refresh();}, select(e){this.setData({categoryId:e.currentTarget.dataset.id});this.refresh();},search(e){this.setData({keyword:e.detail.value});},submitSearch(){this.refresh();},
 sortChange(e){const i=Number(e.detail.value);this.setData({sortIndex:i,sort:['default','price-asc','price-desc'][i]});this.refresh();},
 openProduct(e){wx.navigateTo({url:'/pages/product/index?id='+encodeURIComponent(e.detail.id)});}
});
