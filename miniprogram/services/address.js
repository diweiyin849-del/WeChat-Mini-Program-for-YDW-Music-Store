const {validateAddress}=require('../domain/address');
function createAddressService(storage) {
  const list=()=>{
    const items=storage.read('addresses',[]);
    const seen=new Set();
    const valid=items.filter(a=>a&&typeof a.id==='string'&&a.id&&!seen.has(a.id)&&validateAddress(a).valid&&seen.add(a.id))
      .map(a=>({id:a.id,contact:a.contact.trim(),phone:a.phone,provinceCode:a.provinceCode,cityCode:a.cityCode,districtCode:a.districtCode,regionNames:a.regionNames||[],detail:a.detail.trim(),isDefault:a.isDefault===true}));
    const index=Math.max(0,valid.findIndex(a=>a.isDefault));valid.forEach((a,i)=>{a.isDefault=i===index;});
    if(JSON.stringify(items)!==JSON.stringify(valid))storage.recover('addresses',valid);
    return valid;
  };
  return {list,
    save(address) {
      const check=validateAddress(address);if(!check.valid)throw new Error(check.issues[0]);
      const items=list();const a={id:address.id||'a-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
        contact:address.contact.trim(),phone:String(address.phone),provinceCode:address.provinceCode,cityCode:address.cityCode,districtCode:address.districtCode,
        regionNames:Array.isArray(address.regionNames)?address.regionNames.slice(0,3):[],detail:address.detail.trim(),isDefault:!!address.isDefault};
      const index=items.findIndex(x=>x.id===a.id);if(index>=0)items[index]=a;else items.push(a);
      if(a.isDefault)items.forEach(x=>{x.isDefault=x.id===a.id;});
      if(!items.some(x=>x.isDefault))items[0].isDefault=true;
      storage.write('addresses',items);return a;
    },
    remove(id) {const items=list().filter(a=>a.id!==id);if(items.length&&!items.some(a=>a.isDefault))items[0].isDefault=true;storage.write('addresses',items);},
    clear() {storage.remove('addresses');}
  };
}
module.exports={createAddressService};
