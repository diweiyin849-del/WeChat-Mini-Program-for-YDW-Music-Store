function createQuoteController(service,onUpdate){
 let sequence=0;
 return {invalidate(){++sequence;onUpdate({loading:false,quote:null,error:''});},async update(input){const id=++sequence;onUpdate({loading:true,quote:null,error:''});
  try{const quote=await service.quote(input);if(id===sequence)onUpdate({loading:false,quote,error:''});}
  catch(e){if(id===sequence)onUpdate({loading:false,quote:null,error:e.message||'费用计算失败，请重试'});}
 }};
}
module.exports={createQuoteController};
