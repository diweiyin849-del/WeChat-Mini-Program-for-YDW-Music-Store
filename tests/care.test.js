const test=require('node:test'),assert=require('node:assert/strict');
test('all eight product categories have offline guides and unknown categories are recoverable',()=>{
 const {getCareGuide}=require('../miniprogram/data/instrument-care');
 for(const id of ['piano','digital-piano','guitar','guzheng','violin','flute','erhu','drums']){const g=getCareGuide(id);assert.equal(g.categoryId,id);assert.equal(g.sections.length,4);assert.ok(g.sections.every(s=>s.items.length>0));}
 assert.equal(getCareGuide('other'),null);
});
