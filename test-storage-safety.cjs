// Pure isolated tests for initProfiles fail-closed branch; no personal data touched.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const body=source.slice(source.indexOf('async function initProfiles(){'),source.indexOf('function clearSensitiveUI(){'));
async function scenario(name,{dbValue,dbError,localValue},expectFailure){
 const context={profiles:[],PROFILES_KEY:'profiles',LEGACY_KEY:'legacy',globalThis:{indexedDB:true},
 idbValue:async()=>{if(dbError)throw Error('blocked');return dbValue},
 localStorage:{getItem:(key)=>key==='profiles'?localValue:null},
 storedEnvelope:async()=>null,showProfilePicker:()=>{},console,
 uid:()=>'',safeWrite:async()=>{},saveProfiles:async()=>{},envelopeCache:new Map()};
 vm.createContext(context);vm.runInContext(body,context);
 let failed=false;try{await vm.runInContext('initProfiles()',context)}catch(e){failed=true}
 assert.equal(failed,expectFailure,name);console.log('PASS '+name)
}
(async()=>{
 await scenario('Empty fresh install',{},false);
 await scenario('Valid IndexedDB index',{dbValue:'[{"id":"a","name":"User"}]'},false);
 await scenario('Legacy localStorage index',{dbValue:null,localValue:'[{"id":"a","name":"User"}]'},false);
 await scenario('Corrupted index is not silently emptied',{dbValue:'not-json'},true);
 await scenario('Unexpected index shape is rejected',{dbValue:'{}'},true);
 await scenario('IndexedDB read error is fail-closed',{dbError:true},true);
 console.log('6/6 isolated storage safety tests passed');
})().catch(e=>{console.error(e);process.exit(1)});
