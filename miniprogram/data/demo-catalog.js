// 自定义演示型号与本地乐器示意图，不对应真实品牌商品。
const definitions=[
 ['piano','钢琴','P',[1680000,1980000,2280000,2680000,3280000],['经典立式','雅致立式','家用立式','专业立式','三角演奏']],
 ['digital-piano','电钢琴','DP',[369000,429000,489000,569000,699000],['便携入门','家用经典','木纹家用','舞台演奏','进阶演奏']],
 ['guitar','吉他','G',[68000,98000,128000,168000,228000],['原木民谣','日落民谣','经典古典','电箱民谣','进阶民谣']],
 ['guzheng','古筝','Z',[258000,328000,428000,568000,788000],['入门练习','经典花韵','雅韵演奏','国风演奏','专业演奏']],
 ['violin','小提琴','V',[98000,128000,188000,268000,398000],['入门练习','学生练习','经典演奏','进阶演奏','专业演奏']],
 ['flute','笛子','F',[16000,22000,32000,48000,68000],['入门竹笛','经典曲笛','清音梆笛','进阶竹笛','演奏竹笛']],
 ['erhu','二胡','E',[88000,128000,188000,268000,398000],['入门练习','学生练习','经典演奏','进阶演奏','专业演奏']],
 ['drums','电子鼓','D',[329000,429000,529000,669000,899000],['入门练习','家用静音','网面练习','进阶演奏','舞台演奏']]
];
const categories=definitions.map(([id,name],sort)=>({id,name,sort}));
const parameterBase={piano:['高度','木质外壳 / 钢弦','琴凳、琴罩'], 'digital-piano':['宽度','复合外壳 / 加重键盘','电源、踏板'],guitar:['琴长','木质琴体 / 金属弦','琴包、拨片'],guzheng:['琴长','木质琴体 / 尼龙钢弦','琴架、义甲'],violin:['琴长','木质琴体 / 合金弦','琴盒、琴弓、松香'],flute:['笛长','竹材','笛袋'],erhu:['琴长','木质琴体 / 金属弦','琴盒、琴弓'],drums:['占地宽度','金属支架 / 网面鼓垫','鼓棒、踏板、电源']};
const products=definitions.flatMap(([categoryId,name,code,prices,labels])=>labels.map((label,i)=>{
 const suffix=i===0?'':'-'+(i+1),id='demo-'+categoryId+suffix;
 return {id,categoryId,title:name+' · '+label+'（演示）',brand:'YDW · 演示资料',model:'HQS-'+code+'-0'+(i+1)+'（演示型号）',
 specs:{dimensions:parameterBase[categoryId][0]+' '+([112,110,90,120,50,40,80,100][definitions.findIndex(d=>d[0]===categoryId)]+i*3)+'cm（演示）',material:parameterBase[categoryId][1]+'（演示）',audience:(i<2?'初学者 / 日常练习':i<4?'进阶学习 / 演奏':'进阶演奏')+'（演示）',accessories:parameterBase[categoryId][2]+'（演示）'},beginnerFriendly:i<2,
 description:label+'，供浏览乐器、比较型号和查看费用。型号、图片、价格与库存均为演示资料，不代表实际在售商品；配图为乐器示意图。',
 images:['/assets/instruments/'+categoryId+'-'+(i+1)+'.png'],shippingType:categoryId==='piano'?'piano':'normal',
 deliveryDescription:categoryId==='piano'?'钢琴配送费用以当前门店配置为准，上楼、安装及调律服务请向琴行确认。':'境内及境外均支持演示配送，费用以当前门店配置和查看费用结果为准。',
 status:'active',featured:i===0,skus:[{id:'sku-'+categoryId+suffix+'-standard',productId:id,label:'标准款（演示）',priceFen:prices[i],stock:5}]};
}));
const shop={name:'YDW琴行',provinceCode:'650000',cityCode:'650500',address:'纽约（演示地址）',phone:'123456',hours:'8:00-22:00',shipping:{localFen:0,regionalFen:10000,pianoFen:30000}};
module.exports={categories,products,shop};
