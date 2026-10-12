const fs=require('node:fs'),path=require('node:path');
const seed=require('../miniprogram/data/demo-catalog');
const dir=path.resolve(__dirname,'../cloud-seed');fs.mkdirSync(dir,{recursive:true});
for(const name of ['categories','products'])fs.writeFileSync(path.join(dir,name+'.json'),seed[name].map(x=>JSON.stringify({_id:x.id,...x})).join('\n')+'\n');
fs.writeFileSync(path.join(dir,'shop.json'),JSON.stringify({_id:'main',...seed.shop})+'\n');
console.log('Demo seed exported; do not publish as real merchandise.');
