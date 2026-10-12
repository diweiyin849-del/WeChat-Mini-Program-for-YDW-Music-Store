function contactShop(shop, product, sku) {
 const s=shop||{},phone=String(s.phone||'').trim(),dial=phone.replace(/[\s()-]/g,'');
 const callable=/^\+?\d{7,15}$/.test(dial);
 const message=[s.name||'YDW琴行',product?'咨询商品：'+product.title:'门店咨询',product?'型号：'+product.model:'',sku?'规格：'+sku.label:'',
  '联系电话：'+(phone||'待填写'),'营业时间：'+(s.hours||'待填写'),'门店地址：'+(s.address||'待填写'),
  '请确认当前库存、配送及售后服务，并预约到店试琴。预约时间需与琴行确认。'].filter(Boolean).join('\n');
 wx.showModal({title:product?'咨询这款乐器':'联系琴行',content:message+(callable?'':'\n当前电话为演示或未完整配置，暂不能拨打；可以复制咨询信息。'),
  confirmText:callable?'拨打电话':'复制信息',cancelText:'关闭',fail:()=>wx.showToast({title:'咨询窗口打开失败，请重试',icon:'none'}),success:r=>{
   if(!r.confirm)return;
   if(callable)wx.makePhoneCall({phoneNumber:dial,fail:()=>wx.showToast({title:'未能拨打，请使用显示的电话联系',icon:'none'})});
   else wx.setClipboardData({data:message,fail:()=>wx.showToast({title:'复制失败，请重试',icon:'none'})});
  }});
}
const serviceNotes={
 piano:'钢琴运费仅为配送费用预览。是否包含搬运上楼、安装及调律尚未确认；请在预约配送前与琴行确认楼层、电梯条件、服务范围和可能的额外费用。',
 warranty:'各乐器的保修期限、保修范围及凭证要求尚待琴行确认，请咨询具体型号后再决定购买。当前页面不承诺统一年限或免费保修。',
 repair:'需要维修时，请联系琴行提供品牌、型号和故障情况。琴行确认检测、维修方案、费用及预计时间后再安排；配件与维修是否收费需提前确认。'
};
function deliveryNote(product) {
 const note=product.deliveryDescription||'';
 const legacy=['美国境内配送，纽约市免费，其他城市预览运费100元。','美国境内配送，费用以当前门店配置和查看费用结果为准。','钢琴配送预览300元，上楼、安装及调律服务请向琴行确认。'];
 return legacy.includes(note)?'配送费用以当前门店配置和查看费用结果为准，具体服务安排请联系琴行。':note;
}
module.exports={contactShop,serviceNotes,deliveryNote};
