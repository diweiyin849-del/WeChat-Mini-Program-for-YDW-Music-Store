const {services,productView,load,toast}=require('../../utils/ui');
const {productToForm,formToProduct,shopToForm,formToShop}=require('../../view-models/admin');
const {lowStockItems}=require('../../domain/order-tools');
Page({data:{allowed:false,demo:false,tab:'products',products:[],lowStock:[],categories:[],categoryNames:[],categoryIndex:0,form:null,categoryForm:null,shopForm:null,saving:false,uploading:false,loading:false,error:''},
 onUnload(){this.active=false;this.loadSequence=(this.loadSequence||0)+1;},
 orders(){if(this.data.allowed&&this.data.demo)wx.navigateTo({url:'/pages/demo-orders/index?admin=1'});},
 async checkAppointmentSetup(){if(!this.data.allowed||this.checkingSetup||this.active===false)return;this.checkingSetup=true;try{const r=await services().appointments.adminCheckSetup();if(this.active!==false)this.setData({appointmentSetup:r});}catch(e){if(this.active!==false)toast(e);}finally{this.checkingSetup=false;}},
 onLoad(){this.active=true;},onShow(){return this.refresh();},refresh(){return load(this,async current=>{
  this.setData({allowed:false});const c=services().catalog,access=await c.getAdminAccess();if(!access.allowed)throw new Error('仅琴行管理员可使用此功能');
  const [products,categories,shop]=await Promise.all([c.adminListProducts(),c.listCategories(),c.getShop()]);if(current()&&this.active!==false)this.setData({allowed:true,demo:!!access.demo,products:products.map(productView),lowStock:lowStockItems(products,shop.lowStockThreshold===undefined?2:shop.lowStockThreshold),categories,categoryNames:categories.map(c=>c.name),shopForm:shopToForm(shop)});
 });},
 appointments(){if(this.data.allowed)wx.navigateTo({url:'/pages/appointments/index?admin=1'});},tab(e){this.closeForm();this.setData({tab:e.currentTarget.dataset.value});},
 editProduct(e){if(!this.data.allowed)return;this.editorSequence=(this.editorSequence||0)+1;const p=this.data.products.find(p=>p.id===e.currentTarget.dataset.id);this.setData({tab:'products',form:productToForm(p),categoryIndex:this.data.categories.findIndex(c=>c.id===p.categoryId)});},
 addProduct(){if(!this.data.allowed)return;this.editorSequence=(this.editorSequence||0)+1;const id='product-'+Date.now(),categoryId=this.data.categories[0].id;this.setData({categoryIndex:0,form:{id,categoryId,title:'',brand:'',model:'',description:'',specs:{dimensions:'',material:'',audience:'',accessories:''},beginnerFriendly:false,deliveryDescription:'',images:[],status:'inactive',shippingType:categoryId==='piano'?'piano':'normal',featured:false,skus:[{id:id+'-1',productId:id,label:'标准款',priceYuan:'',stockText:'0'}]}});},
 parameterSwitch(e){this.setData({['form.'+e.currentTarget.dataset.field]:e.detail.value});},formInput(e){this.setData({['form.'+e.currentTarget.dataset.field]:e.detail.value});},
 skuInput(e){this.setData({['form.skus['+e.currentTarget.dataset.index+'].'+e.currentTarget.dataset.field]:e.detail.value});},
 categoryChange(e){const i=Number(e.detail.value),c=this.data.categories[i];this.setData({categoryIndex:i,'form.categoryId':c.id,'form.shippingType':c.id==='piano'?'piano':'normal'});},
 statusChange(e){this.setData({'form.status':e.detail.value?'active':'inactive'});},featuredChange(e){this.setData({'form.featured':e.detail.value});},
 addSku(){const form=this.data.form;if(form.skus.length>=30)return toast('最多添加30个规格');this.setData({'form.skus':form.skus.concat({id:form.id+'-'+Date.now(),productId:form.id,label:'新规格',priceYuan:'',stockText:'0'})});},
 removeSku(e){if(this.data.form.skus.length===1)return toast('至少保留一个规格');this.setData({'form.skus':this.data.form.skus.filter((s,i)=>i!==Number(e.currentTarget.dataset.index))});},
 closeForm(){this.editorSequence=(this.editorSequence||0)+1;this.setData({form:null,categoryForm:null});},
 async saveProduct(){if(!this.data.allowed||this.data.saving||!this.data.form)return;if(this.data.uploading)return toast('请等待图片上传完成');this.setData({saving:true});try{await services().catalog.adminSaveProduct(formToProduct(this.data.form));this.closeForm();await this.refresh();toast(this.data.demo?'演示商品已保存到本机':'商品已保存');}catch(e){toast(e);}finally{this.setData({saving:false});}},
 upload(){
  if(!this.data.allowed||!this.data.form||this.data.uploading||this.data.saving)return;
  if(this.data.form.images.length>=9)return toast('最多添加9张图片');
  const id=this.data.form.id,session=this.editorSequence;const current=()=>this.data.form&&this.data.form.id===id&&this.editorSequence===session;
  this.setData({uploading:true});
  try{wx.chooseImage({count:1,sizeType:['compressed'],success:async r=>{
    try{if(!current())return;const image=await services().catalog.adminUploadImage(r.tempFilePaths[0]);if(current()&&this.data.form.images.length<9)this.setData({'form.images':this.data.form.images.concat(image.fileId)});}
    catch(e){if(current())toast(e);}finally{this.setData({uploading:false});}
  },fail:e=>{this.setData({uploading:false});if(!String(e.errMsg||'').includes('cancel'))toast('无法选择图片，请重试');}});}
  catch(e){this.setData({uploading:false});toast(e);}
 },
 removeImage(e){this.setData({'form.images':this.data.form.images.filter((x,i)=>i!==Number(e.currentTarget.dataset.index))});},
 editCategory(e){const c=this.data.categories.find(c=>c.id===e.currentTarget.dataset.id);this.setData({categoryForm:{...c,sortText:String(c.sort)}});},
 addCategory(){this.setData({categoryForm:{id:'category-'+Date.now(),name:'',sortText:String(this.data.categories.length)}});},
 categoryInput(e){this.setData({['categoryForm.'+e.currentTarget.dataset.field]:e.detail.value});},
 async saveCategory(){if(!this.data.allowed)return;try{const c=this.data.categoryForm;if(!/^-?\d+$/.test(c.sortText))throw new Error('排序须为整数');await services().catalog.adminSaveCategory({id:c.id,name:c.name,sort:Number(c.sortText)});this.setData({categoryForm:null});await this.refresh();toast('分类已保存');}catch(e){toast(e);}},
 shopInput(e){this.setData({['shopForm.'+e.currentTarget.dataset.field]:e.detail.value});},
 async saveShop(){if(!this.data.allowed||this.data.saving)return;this.setData({saving:true});try{await services().catalog.adminSaveShop(formToShop(this.data.shopForm));await this.refresh();if(this.active!==false)toast('店铺资料已保存');}catch(e){if(this.active!==false)toast(e);}finally{if(this.active!==false)this.setData({saving:false});}}
});
