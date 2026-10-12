const config=require('./config');
const {createStorage}=require('./services/storage');
const {createCartService}=require('./services/cart');
const {createAddressService}=require('./services/address');
const {createCatalog}=require('./services/catalog');
const {createSelectionService}=require('./services/selections');
const {createAppointmentService}=require('./services/appointments');
const {createDemoOrderService}=require('./services/demo-orders');
App({globalData:{mode:config.mode,appointmentTemplateId:config.appointmentTemplateId},onLaunch(){
 const storage=createStorage(wx,message=>wx.showToast({title:message,icon:'none'}));
 if(config.mode==='cloud'){
   if(!config.cloudEnv||!wx.cloud)this.startupError='请先配置云开发环境';
   else wx.cloud.init({env:config.cloudEnv,traceUser:false});
 }
 this.services={storage,cart:createCartService(storage),addresses:createAddressService(storage),catalog:createCatalog(wx,storage),selections:createSelectionService(storage)};
 this.services.appointments=createAppointmentService(wx,storage,config.mode,this.services.catalog);
 this.services.orders=createDemoOrderService({mode:config.mode,commerce:this.services.catalog.demoCommerce,readShop:this.services.catalog.demoShop,cart:this.services.cart});
}});
