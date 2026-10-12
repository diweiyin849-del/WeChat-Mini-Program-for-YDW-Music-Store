const PREFIX='heqisheng.preview.v1.';
function createStorage(adapter,onWarning) {
  const warn=onWarning||(()=>{});
  return {
    readStrict(key,fallback) {
      const item=adapter.getStorageSync(PREFIX+key);
      if(item===undefined||item==='')return fallback;
      if(!item||item.version!==1||!Object.prototype.hasOwnProperty.call(item,'data')||item.data===undefined)throw new Error('本机交易数据无法读取，请备份后检查数据');
      return item.data;
    },
    read(key,fallback) {
      try {
        const item=adapter.getStorageSync(PREFIX+key);
        if(item===undefined || item===null || item==='') return fallback;
        if(!item || item.version!==1 || !Object.prototype.hasOwnProperty.call(item,'data')) throw new Error('数据版本不兼容');
        if(Array.isArray(fallback)&&!Array.isArray(item.data))throw new Error('本机数据格式不兼容');
        return item.data;
      } catch(e) {try{adapter.setStorageSync(PREFIX+key,{version:1,data:fallback});}catch(ignored){}warn('本机数据无法读取，已恢复默认状态');return fallback;}
    },
    write(key,value) {adapter.setStorageSync(PREFIX+key,{version:1,data:value});},
    remove(key) {adapter.removeStorageSync(PREFIX+key);},
    recover(key,value) {adapter.setStorageSync(PREFIX+key,{version:1,data:value});warn('本机数据异常，已恢复可用数据');return value;}
  };
}
module.exports={createStorage};
