function normalizeShop(shop){
 const s=JSON.parse(JSON.stringify(shop||{}));
 if(s.name==='和齐升琴行')s.name='YDW琴行';
 if(s.lowStockThreshold===undefined)s.lowStockThreshold=2;
 s.shipping={...s.shipping};
 if(s.shipping.internationalFen===undefined)s.shipping.internationalFen=20000;
 if(s.shipping.internationalPianoFen===undefined)s.shipping.internationalPianoFen=60000;
 return s;
}
function productBrandView(p){return p&&p.brand==='和齐升 · 演示资料'?{...p,brand:'YDW · 演示资料'}:p;}
module.exports={normalizeShop,productBrandView};
