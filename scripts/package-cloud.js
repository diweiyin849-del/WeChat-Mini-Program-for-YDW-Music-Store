const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'cloudfunctions','store');
fs.mkdirSync(dest,{recursive:true});
fs.cpSync(path.join(root,'miniprogram','domain'),path.join(dest,'domain'),{recursive:true});
fs.mkdirSync(path.join(dest,'server'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'server'))){const content=fs.readFileSync(path.join(root,'server',file),'utf8').replaceAll("../miniprogram/domain/","../domain/");fs.writeFileSync(path.join(dest,'server',file),content);}
console.log('Cloud function packaged: cloudfunctions/store');
