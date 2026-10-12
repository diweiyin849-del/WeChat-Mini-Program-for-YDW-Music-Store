const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function walk(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function checkProject(root){
 const errors=[],mini=path.join(root,'miniprogram');
 const configPath=path.join(mini,'app.json');
 let app;
 try{app=JSON.parse(fs.readFileSync(configPath,'utf8'));}catch(e){errors.push('app.json无法读取或解析');return errors;}
 for(const page of app.pages||[])for(const ext of ['js','json','wxml','wxss'])if(!fs.existsSync(path.join(mini,page+'.'+ext)))errors.push('缺少页面文件：'+page+'.'+ext);
 for(const file of [...walk(mini),...walk(path.join(root,'server'))]){
  const ext=path.extname(file),text=fs.readFileSync(file,'utf8'),label=path.relative(root,file);
  if(ext==='.js'){
   try{new vm.Script(text,{filename:label});}catch(e){errors.push(label+'语法错误：'+e.message);}
   if(/\brequestPayment\b|createOrder|paySuccess|api\.mch\.weixin\.qq\.com|\/pay\/transactions\//.test(text))errors.push(label+'包含支付或真实订单路径');
   for(const m of text.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){
     const target=path.resolve(path.dirname(file),m[1]);if(!fs.existsSync(target)&&!fs.existsSync(target+'.js')&&!fs.existsSync(target+'.json'))errors.push(label+'依赖不存在：'+m[1]);
   }
  }
  if(ext==='.json')try{JSON.parse(text);}catch(e){errors.push(label+' JSON格式错误');}
  if(ext==='.wxml'){
   const stack=[];for(const match of text.matchAll(/<\s*(\/?)\s*([a-zA-Z][\w-]*)([^>]*?)>/g)){
     const [,closing,tag,attrs]=match;if(closing){if(stack.pop()!==tag){errors.push(label+'标签未正确闭合：'+tag);break;}}else if(!attrs.trim().endsWith('/'))stack.push(tag);
   }if(stack.length)errors.push(label+'存在未闭合标签：'+stack.join(','));
  }
 }
 return errors;
}
if(require.main===module){const errors=checkProject(path.resolve(__dirname,'..'));if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Project checks passed: page files, JavaScript, JSON, WXML, dependencies and preview-only scope.');}
module.exports={checkProject};
