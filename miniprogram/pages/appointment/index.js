const {services,load,toast}=require('../../utils/ui');
const {appointmentDates}=require('../../domain/appointments');
const requestId=()=>'r-'+Date.now()+'-'+Math.random().toString(36).slice(2,12);
Page({data:{product:null,sku:null,demo:false,dates:[],times:Array.from({length:14},(_,i)=>String(i+8).padStart(2,'0')+':00'),dateIndex:0,timeIndex:0,contact:'',phone:'',note:'',submitting:false,saved:false,loading:false,error:''},
 onLoad(o){this.active=true;this.productId=o.productId;this.skuId=o.skuId;this.requestId=requestId();this.setData({demo:getApp().globalData.mode==='demo'});return this.refresh();},onUnload(){this.active=false;this.loadSequence=(this.loadSequence||0)+1;},
 refresh(){return load(this,async current=>{const p=await services().catalog.getProduct(this.productId);if(!p)throw new Error('商品已下架或不存在');const sku=p.skus.find(s=>s.id===this.skuId);if(!sku)throw new Error('商品规格不存在');const dates=appointmentDates(new Date());if(current()&&this.active!==false)this.setData({product:p,sku,dates});});},
 input(e){if(this.data.submitting)return;this.requestId=requestId();this.setData({[e.currentTarget.dataset.field]:e.detail.value,saved:false});},
 pick(e){if(this.data.submitting)return;this.requestId=requestId();this.setData({[e.currentTarget.dataset.field]:Number(e.detail.value),saved:false});},
 async submit(){if(this.data.submitting||this.data.saved||!this.data.product)return;this.setData({submitting:true,error:''});try{await services().appointments.createAppointment({requestId:this.requestId,productId:this.productId,skuId:this.skuId,date:this.data.dates[this.data.dateIndex],time:this.data.times[this.data.timeIndex],contact:this.data.contact,phone:this.data.phone,note:this.data.note});if(this.active!==false){this.setData({saved:true});toast(this.data.demo?'演示预约已保存，未发送':'已提交，等待琴行确认');}}catch(e){if(this.active!==false)this.setData({error:e.message||'预约提交失败，请重试'});}finally{if(this.active!==false)this.setData({submitting:false});}},
 list(){wx.navigateTo({url:'/pages/appointments/index'});}
});
