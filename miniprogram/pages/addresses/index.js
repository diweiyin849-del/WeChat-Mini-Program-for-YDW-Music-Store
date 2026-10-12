const {services,toast}=require('../../utils/ui');
const blank=()=>({id:'',contact:'',phone:'',provinceCode:'',cityCode:'',districtCode:'',regionNames:[],detail:'',isDefault:false});
Page({data:{addresses:[],editing:false,form:blank(),selectable:false},onLoad(o){this.setData({selectable:o.select==='1'});},onShow(){this.refresh();},
 refresh(){try{this.setData({addresses:services().addresses.list()});}catch(e){toast(e);}},
 add(){this.setData({editing:true,form:blank()});},edit(e){const a=this.data.addresses.find(a=>a.id===e.currentTarget.dataset.id);this.setData({editing:true,form:{...a}});},
 input(e){this.setData({['form.'+e.currentTarget.dataset.field]:e.detail.value});},
 region(e){const codes=e.detail.code||[];this.setData({'form.regionNames':e.detail.value,'form.provinceCode':codes[0]||'','form.cityCode':codes[1]||'','form.districtCode':codes[2]||''});},
 defaultChange(e){this.setData({'form.isDefault':e.detail.value});},cancel(){this.setData({editing:false});},
 save(){try{const s=services(),a=s.addresses.save(this.data.form);this.setData({editing:false});this.refresh();toast('地址已保存在本机');if(this.data.selectable){s.storage.write('selected-address',a.id);wx.navigateBack();}}catch(e){toast(e);}},
 select(e){if(!this.data.selectable)return;services().storage.write('selected-address',e.currentTarget.dataset.id);wx.navigateBack();},
 remove(e){const id=e.currentTarget.dataset.id;wx.showModal({title:'删除本机地址',content:'确认删除这条地址？',success:r=>{if(r.confirm){services().addresses.remove(id);this.refresh();}}});}
});
