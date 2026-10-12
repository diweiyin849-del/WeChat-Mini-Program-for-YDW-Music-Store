const test=require('node:test'),assert=require('node:assert/strict');
const {createStorage}=require('../miniprogram/services/storage');
const {memoryPlatform}=require('./helpers');
test('favorites persist across restart and can be removed independently of comparison',()=>{
 const {createSelectionService}=require('../miniprogram/services/selections');
 const storage=createStorage(memoryPlatform()),s=createSelectionService(storage);
 s.toggleFavorite('demo-guitar');s.addCompare('demo-guitar');
 const restored=createSelectionService(storage);assert.deepEqual(restored.favorites(),['demo-guitar']);
 restored.toggleFavorite('demo-guitar');assert.deepEqual(restored.favorites(),[]);assert.deepEqual(restored.comparison(),['demo-guitar']);
});
test('comparison rejects a fourth model without losing the chosen three and duplicate add is harmless',()=>{
 const {createSelectionService}=require('../miniprogram/services/selections');
 const s=createSelectionService(createStorage(memoryPlatform()));
 for(const id of ['a','b','c'])s.addCompare(id);
 s.addCompare('a');assert.throws(()=>s.addCompare('d'),/3/);assert.deepEqual(s.comparison(),['a','b','c']);
 s.removeCompare('b');s.addCompare('d');assert.deepEqual(s.comparison(),['a','c','d']);s.clear();assert.deepEqual(s.comparison(),[]);
});
test('corrupt selection data recovers and does not navigate using invalid ids',()=>{
 const {createSelectionService}=require('../miniprogram/services/selections');
 const storage=createStorage(memoryPlatform());storage.write('favorites',['good','good',null,'../bad']);storage.write('comparison',['a','b','c','d']);
 const s=createSelectionService(storage);assert.deepEqual(s.favorites(),['good']);assert.deepEqual(s.comparison(),['a','b','c']);
 assert.throws(()=>s.toggleFavorite('../bad'),/无效/);
});
