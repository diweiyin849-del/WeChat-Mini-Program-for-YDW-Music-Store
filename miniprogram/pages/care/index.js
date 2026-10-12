const {guides,getCareGuide}=require('../../data/instrument-care');
const {services,toast}=require('../../utils/ui');
const {contactShop}=require('../../utils/contact');
Page({data:{guides,guide:null,error:''},onLoad(o){this.active=true;const id=o&&o.categoryId;this.setData({guide:id?getCareGuide(id):null,error:id&&!getCareGuide(id)?'暂未找到这类乐器的养护指南':''});},onUnload(){this.active=false;},
 choose(e){this.setData({guide:getCareGuide(e.currentTarget.dataset.id),error:''});},all(){this.setData({guide:null,error:''});},
 async call(){try{const shop=await services().catalog.getShop();if(this.active!==false)contactShop(shop);}catch(e){if(this.active!==false)toast(e);}},
 source(e){const s=this.data.guide&&this.data.guide.sources[Number(e.currentTarget.dataset.index)];if(s)wx.setClipboardData({data:s.url,success:()=>{if(this.active!==false)toast('参考资料链接已复制');}});}
});
