const {getMinPriceFen}=require('../domain/catalog');
const money=n=>Number.isSafeInteger(n)?(n/100).toFixed(2):'—';
function productView(p){return {...p,priceText:money(getMinPriceFen(p)),stockCount:(p.skus||[]).reduce((n,s)=>n+(Number.isSafeInteger(s.stock)&&s.stock>0?s.stock:0),0),soldOut:!(p.skus||[]).some(s=>s.stock>0),image:p.images&&p.images[0]||''};}
async function load(page,task){const id=page.loadSequence=(page.loadSequence||0)+1;const current=()=>id===page.loadSequence;page.setData({loading:true,error:''});try{await task(current);}catch(e){if(current())page.setData({error:e.message||'加载失败，请重试'});}finally{if(current())page.setData({loading:false});}}
function toast(error){wx.showToast({title:typeof error==='string'?error:error.message||'操作失败',icon:'none'});}
function services(){const app=getApp();if(app.startupError)throw new Error(app.startupError);return app.services;}
module.exports={money,productView,load,toast,services};
