'use strict';
const $=id=>document.getElementById(id);
const DEFAULT_CATS=[
 ['bank','金融銀行','bank','#e2f0ff'],
 ['invest','證券投資','bank','#e4ebff'],
 ['payment','電子支付','shop','#fff0dc'],
 ['shop','購物平台','shop','#ffe9ee'],
 ['social','社群通訊','social','#e8f6e9'],
 ['gov','政府服務','gov','#ede9ff'],
 ['email','電子郵件','email','#fff1d8'],
 ['game','遊戲娛樂','game','#fbe5f4'],
 ['stream','影音串流','game','#f4e7ff'],
 ['cloud','雲端儲存','cloud','#e6f0ff'],
 ['work','工作商務','bank','#e9f1ed'],
 ['school','教育學習','gov','#fff0e5'],
 ['health','醫療健康','home','#f5e8ed'],
 ['travel','交通旅遊','home','#e4f5f0'],
 ['food','餐飲外送','shop','#fff0e9'],
 ['utility','電信水電','home','#e6f4f8'],
 ['device','設備與智慧家庭','settings','#e8eff5'],
 ['home','家庭生活','home','#e5f4f5'],
 ['other','其他帳號','other','#ebf0f5']
].map(([id,name,icon,color])=>({id,name,icon,color}));
// Only append missing built-in categories. Never move or overwrite existing password records.
function ensureBuiltInCategories(data){
 if(!data||!Array.isArray(data.categories))return false;
 const known=new Set(data.categories.map(x=>x.id));let changed=false;
 for(const item of DEFAULT_CATS){if(!known.has(item.id)){data.categories.push({...item});known.add(item.id);changed=true}}
 return changed;
}
const LEGACY_KEY='shiguang-family-vault-v1', PROFILES_KEY='shiguang-vault-profiles-v2';
let profiles=[],activeProfileId=null, googleEmail=null;
const keyName=()=>activeProfileId?'shiguang-vault-data-v2-'+activeProfileId:null;

const SVG_ICONS={
  vault:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"></rect><circle cx="12" cy="12" r="3.4"></circle><path d="M12 8.6v6.8M8.6 12h6.8"></path></svg>`,
  all:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.2 4.8L19 10l-4.8 2.2L12 17l-2.2-4.8L5 10l4.8-2.2L12 3z"></path><circle cx="19" cy="5" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="5" cy="19" r="1.2" fill="currentColor" stroke="none"></circle></svg>`,
  bank:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-4 9 4"></path><path d="M4.5 10.5h15"></path><path d="M6 10.5V18M10 10.5V18M14 10.5V18M18 10.5V18"></path><path d="M4 19.5h16"></path></svg>`,
  shop:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14l-1.3 9H6.3L5 9z"></path><path d="M8.5 9V7.8A3.5 3.5 0 0112 4.3a3.5 3.5 0 013.5 3.5V9"></path></svg>`,
  social:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6.5h14a2 2 0 012 2v7a2 2 0 01-2 2H10l-4 3v-3H5a2 2 0 01-2-2v-7a2 2 0 012-2z"></path><path d="M8 11h8M8 14h5"></path></svg>`,
  gov:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-4 9 4"></path><path d="M5 10.5h14"></path><path d="M6 18h12"></path><path d="M7.5 10.5V18M12 10.5V18M16.5 10.5V18"></path><path d="M4 19.5h16"></path></svg>`,
  email:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M5.5 8l6.5 5 6.5-5"></path></svg>`,
  game:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 9h9a4.5 4.5 0 014.3 5.9l-1 3A3 3 0 0117 20a3 3 0 01-2.5-1.4L13 16.5h-2l-1.5 2.1A3 3 0 016.5 20a3 3 0 01-2.8-2.1l-1-3A4.5 4.5 0 017 9z"></path><path d="M8 12v4M6 14h4"></path><circle cx="16.3" cy="13.2" r=".9" fill="currentColor" stroke="none"></circle><circle cx="18.3" cy="15.2" r=".9" fill="currentColor" stroke="none"></circle></svg>`,
  home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5L12 4l8 6.5"></path><path d="M6 9.8V20h12V9.8"></path><path d="M10 20v-5h4v5"></path></svg>`,
  other:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="12" height="9" rx="2.5"></rect><path d="M8.5 10V7.8A3.5 3.5 0 0112 4.3a3.5 3.5 0 013.5 3.5V10"></path><circle cx="12" cy="14.5" r="1"></circle><path d="M12 15.5v1.8"></path></svg>`,
  person:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"></circle><path d="M5.5 19a6.5 6.5 0 0113 0"></path></svg>`,
  group:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"></circle><circle cx="16" cy="8" r="2.5"></circle><path d="M4.5 19a5.5 5.5 0 019 0"></path><path d="M13 18a4.5 4.5 0 017.5 0"></path></svg>`,
  cloud:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 18a4.5 4.5 0 01-.4-9 5.8 5.8 0 0110.9-1.3A4.2 4.2 0 1118 18H7.5z"></path><path d="M12 11v6"></path><path d="M9.7 14.3L12 17l2.3-2.7"></path></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.3"></circle><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a2 2 0 012.8-2.8l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a2 2 0 014 0v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 2.8l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a2 2 0 010 4h-.2a1 1 0 00-.9.6z"></path></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="5.5"></circle><path d="M15 15l5 5"></path></svg>`,
  calendar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M8 3.8v3.4M16 3.8v3.4M4 9h16"></path></svg>`,
  arrow:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>`
};
function iconMarkup(name,size='md',label=''){const aliases={'🏦':'bank','🛍️':'shop','💬':'social','🏛️':'gov','📧':'email','🎮':'game','🏠':'home','🔐':'other','✨':'all','🙂':'person','👨‍👩‍👧‍👦':'group','👨‍👩‍👧':'group','☁️':'cloud'};const svg=SVG_ICONS[aliases[name]||name];if(svg)return `<span class="svgicon ${size}"${label?` aria-label="${esc(label)}"`:''}>${svg}</span>`;return `<span class="emoji-fallback">${esc(name||'•')}</span>`}

// IndexedDB stores only encrypted envelopes and the non-secret profile index.
// Legacy localStorage records are read but never automatically deleted.
const IDB_NAME='shiguang-family-vault-storage', IDB_STORE='entries';
const envelopeCache=new Map();
const testStorageKey='shiguang-vault-selftest-v176';
let indexedDbReady=null;
function vaultStorageError(e){if(e?.name==='QuotaExceededError')return Error('裝置儲存空間不足。未刪除任何原有資料；請先備份既有保險箱，再檢查瀏覽器的網站儲存空間。');return Error('無法安全儲存資料：'+String(e?.message||e))}
function openVaultDB(){
 if(indexedDbReady)return indexedDbReady;
 indexedDbReady=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(Error('此瀏覽器無法使用 IndexedDB'));
  const req=indexedDB.open(IDB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(IDB_STORE))req.result.createObjectStore(IDB_STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('IndexedDB 無法開啟'));
  req.onblocked=()=>reject(Error('其他分頁正在鎖定資料庫，請關閉相同網站的其他分頁'));
 });indexedDbReady=indexedDbReady.catch(error=>{indexedDbReady=null;throw error});return indexedDbReady;
}
async function idbValue(action,key,value){
 const db=await openVaultDB();
 return new Promise((resolve,reject)=>{
  const transaction=db.transaction(IDB_STORE,action==='get'?'readonly':'readwrite');
  const store=transaction.objectStore(IDB_STORE);
  const req=action==='get'?store.get(key):action==='delete'?store.delete(key):store.put(value,key);
  let result;
  req.onsuccess=()=>{result=req.result};
  req.onerror=()=>reject(req.error||Error('IndexedDB 寫入失敗'));
  transaction.oncomplete=()=>resolve(result);
  transaction.onerror=()=>reject(transaction.error||Error('IndexedDB 交易失敗'));
  transaction.onabort=()=>reject(transaction.error||Error('IndexedDB 交易取消'));
 });
}
async function safeWrite(key,serialized){
 // Write to IndexedDB first so localStorage's 5 MiB quota does not block creation.
 try{await idbValue('put',key,serialized);return 'indexeddb'}
 catch(idbErr){if(globalThis.indexedDB)throw vaultStorageError(idbErr);try{localStorage.setItem(key,serialized);return 'localStorage'}catch(localErr){throw vaultStorageError(localErr)}}
}
async function storedEnvelope(id){
 const key='shiguang-vault-data-v2-'+id;
 if(envelopeCache.has(key))return envelopeCache.get(key);
 let content=null;try{content=await idbValue('get',key)}catch{}
 if(!content){try{content=localStorage.getItem(key)}catch{}}
 if(content){try{const obj=JSON.parse(content);envelopeCache.set(key,obj);return obj}catch{}}
 return null;
}
// Read the primary storage, bypassing the in-memory cache. Never assume a write
// succeeded merely because the IndexedDB transaction completed.
async function readPersistedEnvelope(id){
 const name='shiguang-vault-data-v2-'+id;
 let raw;
 // Older installations may still keep the encrypted envelope exclusively in
 // localStorage. Read the authoritative IndexedDB copy first, falling back
 // only when that key is missing (not when IndexedDB reports an error).
 if(globalThis.indexedDB){raw=await idbValue('get',name)}
 if(raw==null){try{raw=localStorage.getItem(name)}catch(error){throw vaultStorageError(error)}}
 if(typeof raw!=='string')throw Error('本機找不到可匯出的加密資料；請勿清除網站資料');
 let value;
 try{value=JSON.parse(raw)}catch{throw Error('本機加密資料 JSON 格式損壞')}
 if(!validateEnvelope(value))throw Error('本機加密資料格式驗證失敗');
 return value;
}
// V1.9.4: Atomic compare-and-swap of the encrypted envelope in IndexedDB.
// The expected envelope is the last ciphertext this tab actually loaded.
const staleProfiles=new Set();
function envelopeRaw(obj){return obj==null?null:JSON.stringify(obj)}
async function atomicEnvelopeWrite(id,envelope,expected){
 const storageKey='shiguang-vault-data-v2-'+id;
 const fresh=JSON.stringify(envelope), before=envelopeRaw(expected);
 if(!globalThis.indexedDB){
  const actual=localStorage.getItem(storageKey);
  if(actual!==before)throw Error('其他分頁或視窗已修改此保險箱。請重新鎖定並解鎖，取得最新資料後再操作');
  localStorage.setItem(storageKey,fresh);
  if(localStorage.getItem(storageKey)!==fresh)throw Error('本機寫入驗證失敗');
  envelopeCache.set(storageKey,envelope);return;
 }
 const db=await openVaultDB();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(IDB_STORE,'readwrite'), store=tx.objectStore(IDB_STORE);
  let changed=false, failure=null;
  const get=store.get(storageKey);
  get.onsuccess=()=>{
   const existing=get.result==null?null:get.result;
   // Legacy vaults may live only in localStorage, but never silently overwrite them.
   const legacy=existing==null?localStorage.getItem(storageKey):null;
   const actual=existing==null?legacy:existing;
   if(actual!==before){changed=true;tx.abort();return}
   store.put(fresh,storageKey);
  };
  get.onerror=()=>{failure=get.error;tx.abort()};
  tx.oncomplete=resolve;
  tx.onabort=()=>reject(changed?Error('其他分頁或視窗已修改此保險箱。請重新鎖定並解鎖，取得最新資料後再操作'):failure||tx.error||Error('加密資料寫入交易取消'));
  tx.onerror=()=>{};
 });
 const stored=await readPersistedEnvelope(id);
 if(envelopeRaw(stored)!==fresh)throw Error('本機加密資料寫入後驗證失敗');
 envelopeCache.set(storageKey,stored);
}
async function saveEnvelope(id,envelope){
 const key='shiguang-vault-data-v2-'+id;
 const serialized=JSON.stringify(envelope);
 await safeWrite(key,serialized);
 const verified=await readPersistedEnvelope(id);
 if(JSON.stringify(verified)!==serialized)throw Error('加密資料寫入驗證失敗，請勿關閉網頁，先檢查儲存空間');
 envelopeCache.set(key,verified);
}

function selectedProfile(){return profiles.find(p=>p.id===activeProfileId)}
async function saveProfiles(){
 const data=JSON.stringify(profiles);
 await safeWrite(PROFILES_KEY,data);
 const written=globalThis.indexedDB?await idbValue('get',PROFILES_KEY):localStorage.getItem(PROFILES_KEY);
 if(written!==data)throw Error('使用者清單寫入驗證失敗');
}
async function initProfiles(){
 // Fail closed: a storage failure or corrupt profile list must never look like
 // an empty installation where a new profile can overwrite the old index.
 let raw=null;
 if(globalThis.indexedDB){
  try{raw=await idbValue('get',PROFILES_KEY)}
  catch(e){throw Error('無法讀取 IndexedDB 使用者清單，為保護原始資料已停止啟動：'+e.message)}
 }
 if(raw==null){
  try{raw=localStorage.getItem(PROFILES_KEY)}
  catch(e){throw Error('無法讀取舊版使用者清單，已停止啟動：'+e.message)}
 }
 if(raw!=null){
  try{profiles=JSON.parse(raw)}catch{throw Error('使用者清單格式損壞，請勿建立新保險箱或清除網站資料')}
  if(!Array.isArray(profiles)||profiles.some(p=>!p||typeof p.id!=='string'||typeof p.name!=='string'))
   throw Error('使用者清單內容不正確，為避免覆蓋已停止啟動');
 }else profiles=[];
 // Load saved encrypted envelopes before any gate UI uses synchronous getEnvelope().
 for(const p of profiles)await storedEnvelope(p.id);
 try{
  const legacy=localStorage.getItem(LEGACY_KEY);
  if(legacy&&!profiles.some(p=>p.legacy)){
   const id=uid(), entry={id,name:'原本的家庭保險箱',icon:'home',legacy:true};
   await safeWrite('shiguang-vault-data-v2-'+id,legacy);
   envelopeCache.set('shiguang-vault-data-v2-'+id,JSON.parse(legacy));
   profiles.unshift(entry);await saveProfiles();
  }
 }catch(e){console.warn('舊版資料匯入未完成；原始資料仍保留',e)}
 activeProfileId=null;showProfilePicker();
}
function clearSensitiveUI(){
 for(const id of ['records','members','dueList','detailContent','detailTitle','cloudBackupList']){const node=$(id);if(node)node.replaceChildren()}
 for(const id of ['rPassword','rTransactionPassword','rSecurityAnswer','rSecurityPin','rRecoveryCodes','rRecoveryContact','rSecurityQuestion','rUser','rNote','rTitle','master','masterConfirm']){const node=$(id);if(node)node.value=''}
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 for(const id of ['rPassword','rTransactionPassword','rSecurityAnswer','rSecurityPin']){const node=$(id);if(node)node.type='password'}
 $('app').classList.remove('recovery-mode');
}
function showProfilePicker(){$('master').value='';$('masterConfirm').value='';vault=null;masterKey=null;encryptionSalt=null;activeProfileId=null;stopAutoBackup();clearSensitiveUI();
 $('gate').classList.add('hidden');$('app').classList.add('hidden');$('profilePicker').classList.remove('hidden');$('lockBtn').classList.add('hidden');
 $('profileCreateForm').classList.add('hidden');$('profileCreateError').classList.add('hidden');$('profileList').innerHTML=profiles.length?profiles.map(p=>`<button class="profile-choice" data-profile="${esc(p.id)}"><span class="ricon">${iconMarkup(p.icon||'vault')}</span><span class="rinfo"><strong>${esc(p.name)}</strong><small>獨立主密碼 · 獨立加密資料</small></span><span class="chevron">${iconMarkup('arrow','sm')}</span></button>`).join(''):'<p class="hint">首次使用請建立您的私人保險箱。</p>';
 $('profileList').querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>chooseProfile(b.dataset.profile));refreshRecoveryUI();}
function chooseProfile(id){stopAutoBackup();if(!profiles.some(p=>p.id===id))return;activeProfileId=id;
 $('profilePicker').classList.add('hidden');$('profileName').textContent=selectedProfile().name;gateMode();refreshRecoveryUI()}
function creationError(message,target='profileCreateError') {const el=$(target);if(el){el.textContent=message;el.classList.remove('hidden')}notify(message)}
function checkLocalSecurity(){
 if(!globalThis.crypto||!crypto.subtle||!crypto.getRandomValues)throw Error('目前網址不支援安全加密。請使用 GitHub Pages 的 https:// 網址開啟，不要直接點開 index.html，也不要用一般 http:// 網址。');
 if(!globalThis.localStorage)throw Error('瀏覽器不允許本機儲存，請使用一般瀏覽模式並允許網站儲存資料。');
 // localStorage may be full although IndexedDB can still store encrypted vault data.
}
$('createProfile').onclick=()=>{const form=$('profileCreateForm');form.classList.remove('hidden');$('profileCreateError').classList.add('hidden');$('newProfileName').focus();};
$('cancelProfileCreate').onclick=()=>{$('profileCreateForm').classList.add('hidden');$('newProfileName').value=''};
$('profileCreateForm').onsubmit=async e=>{e.preventDefault();const name=$('newProfileName').value.trim();if(!name)return creationError('請輸入使用者名稱');let p=null;try{
 checkLocalSecurity();
 if(!crypto.randomUUID)throw Error('瀏覽器版本不支援建立安全識別碼，請更新瀏覽器並以 HTTPS 開啟。');
 p={id:uid(),name:name.slice(0,40),icon:'vault'};
 const next=[...profiles,p];const previous=profiles;profiles=next;
 try{await saveProfiles()}catch(error){profiles=previous;throw error}
 $('newProfileName').value='';$('profileCreateForm').classList.add('hidden');chooseProfile(p.id);
 }catch(err){creationError(err.message||'建立使用者失敗，請檢查瀏覽器儲存權限')}};
$('switchFromGate').onclick=async()=>{if(await settleCurrentWrites())showProfilePicker()};
$('switchProfile').onclick=async()=>{if(editIsDirty()&&!safeEditDismiss())return;if(!confirm('切換使用者前將鎖定目前保險箱，確定切換？'))return;if(!await settleCurrentWrites())return;for(const d of document.querySelectorAll('dialog[open]'))d.close();showProfilePicker()};
let vault=null, masterKey=null, encryptionSalt=null, selectedCat='all', selectedRecord=null, token=null, tokenClient=null, pendingCloudAction=null, lastActive=Date.now();let smallMode='member';
let batchMode=false, batchSaving=false;const batchSelected=new Set();
function resetBatch(){if(typeof closeSmart==='function'&&$('smartPanel'))closeSmart();batchMode=false;batchSelected.clear();updateBatchControls();}
function updateBatchControls(){const panel=$('batchPanel');if(!panel)return;panel.classList.toggle('hidden',!batchMode);$('batchToggle').textContent=batchMode?'完成整理':'批次整理';$('batchToggle').setAttribute('aria-pressed',String(batchMode));const visible=batchMode&&vault?matchingRecords(selectedCat):[];const visibleIds=new Set(visible.map(r=>r.id));for(const id of batchSelected)if(!visibleIds.has(id))batchSelected.delete(id);$('batchCount').textContent=`已選 ${batchSelected.size} 筆／目前 ${visible.length} 筆`;$('batchApply').disabled=batchSaving||!batchSelected.size||!$('batchCategory').value;$('batchSelectAll').disabled=batchSaving||!visible.length;$('batchClear').disabled=batchSaving||!batchSelected.size;$('batchCategory').disabled=batchSaving;}
const uid=()=>crypto.randomUUID();const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const fmt=d=>d?new Date(d+'T12:00:00').toLocaleDateString('zh-TW'):'未設定';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function notify(msg){const e=$('toast');e.textContent=msg;e.style.display='block';clearTimeout(notify.t);notify.t=setTimeout(()=>e.style.display='none',3200)}
const emptyVault=()=>({schema:1,updatedAt:new Date().toISOString(),members:[{id:'self',name:'自己',icon:'person'},{id:'family',name:'全家共用',icon:'group'}],categories:structuredClone(DEFAULT_CATS),records:[]});
function validateEnvelope(e){return e&&e.format==='shiguang-family-vault'&&e.version===1&&typeof e.salt==='string'&&typeof e.iv==='string'&&typeof e.data==='string'&&e.salt.length<200&&e.iv.length<200&&e.data.length<15_000_000;}
function validateVault(v){return v&&v.schema===1&&Array.isArray(v.members)&&Array.isArray(v.categories)&&Array.isArray(v.records)&&v.records.length<50000;}
async function deriveKey(password,salt){const seed=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function enc(v,key,salt){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(v)));return {format:'shiguang-family-vault',version:1,kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),data:b64(data)};}
async function dec(obj,password){if(!validateEnvelope(obj))throw Error('備份格式不正確');if(obj.iterations!==600000||obj.kdf!=='PBKDF2-SHA256'||obj.cipher!=='AES-256-GCM')throw Error('不支援的加密格式');const salt=unb64(obj.salt);if(salt.length!==16)throw Error('加密參數錯誤');const iv=unb64(obj.iv);if(iv.length!==12)throw Error('加密參數錯誤');const key=await deriveKey(password,salt);const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,unb64(obj.data));const data=JSON.parse(new TextDecoder().decode(raw));if(!validateVault(data))throw Error('資料格式不正確');return {key,salt,data};}
function getEnvelope(){const key=keyName();if(envelopeCache.has(key))return envelopeCache.get(key);try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
// Serialize writes per profile: an older asynchronous encryption must never overwrite a newer save.
const saveChains=new Map();
async function settleCurrentWrites(){const pending=activeProfileId&&saveChains.get(activeProfileId);if(!pending)return true;try{await pending;return true}catch(e){notify('資料仍未成功儲存，已取消切換：'+e.message);return false}}
async function persist(){
 if(!vault||!masterKey||!activeProfileId)throw Error('保險箱尚未解鎖');
 const id=activeProfileId, source=vault, key=masterKey, salt=encryptionSalt;
 const snapshot=structuredClone(source), timestamp=new Date().toISOString();snapshot.updatedAt=timestamp;
 const previous=saveChains.get(id)||Promise.resolve();
 const task=previous.catch(()=>{}).then(async()=>{
  const envelope=await enc(snapshot,key,salt);
  if(id!==activeProfileId||vault!==source||masterKey!==key)throw Error('儲存期間保險箱已切換，請確認資料');
  if(staleProfiles.has(id))throw Error('此保險箱已偵測到版本衝突，請鎖定後重新解鎖再修改');
  const preceding=getEnvelope();
  try{await atomicEnvelopeWrite(id,envelope,preceding)}catch(error){
   // Never roll back when another tab wrote a newer envelope.
   if(String(error.message).includes('其他分頁'))staleProfiles.add(id);
   else if(preceding){
    try{
     const actual=await readPersistedEnvelope(id);
     // Roll back only if this tab's new ciphertext is actually on disk.
     if(envelopeRaw(actual)===envelopeRaw(envelope))await atomicEnvelopeWrite(id,preceding,envelope);
    }catch(rollbackError){
     if(String(rollbackError.message).includes('其他分頁'))staleProfiles.add(id);
     throw Error('寫入驗證失敗，無法確認原始密文已安全復原。請保留網站資料並檢查備份：'+rollbackError.message);
    }
   }
   throw error;
  }
  source.updatedAt=timestamp;setCloudPrefs({lastLocalChange:timestamp});queueAutoBackup();updateCloudStatus();
 });
 saveChains.set(id,task);
 try{await task}finally{if(saveChains.get(id)===task)saveChains.delete(id)}
}
function gateMode(){if(!activeProfileId)return showProfilePicker();$('gateError').classList.add('hidden');const exists=!!getEnvelope();$('gateTitle').textContent=exists?'解鎖私人保險箱':'建立私人保險箱';$('gateDesc').textContent=exists?'輸入此使用者的主密碼。':'請為這位使用者設定獨立的主密碼（至少 12 字元）。';$('confirmWrap').classList.toggle('hidden',exists);$('gateBtn').textContent=exists?'解鎖保險箱':'建立加密資料庫';$('app').classList.add('hidden');$('gate').classList.remove('hidden');$('lockBtn').classList.add('hidden');}
// A failed write or failed recovery can leave the tab's in-memory key or
// encrypted cache inconsistent with IndexedDB. Never continue editing.
async function lockAfterUncertainWrite(){
 const id=activeProfileId;
 stopAutoBackup();resetBatch();clearSensitiveUI();
 vault=null;masterKey=null;encryptionSalt=null;selectedRecord=null;
 if(id)envelopeCache.delete('shiguang-vault-data-v2-'+id);
 if(id){try{const latest=await readPersistedEnvelope(id);envelopeCache.set('shiguang-vault-data-v2-'+id,latest)}catch{}}
 gateMode();
}
async function lock(){if(!await settleCurrentWrites())return;stopAutoBackup();resetBatch();clearSensitiveUI();vault=null;masterKey=null;encryptionSalt=null;selectedRecord=null;$('master').value='';$('masterConfirm').value='';for(const d of document.querySelectorAll('dialog[open]'))d.close();gateMode();notify('已安全鎖定');}
async function unlock(password){const obj=await readPersistedEnvelope(activeProfileId);envelopeCache.set(keyName(),obj);staleProfiles.delete(activeProfileId);const result=await dec(obj,password);vault=result.data;const categoryMigrated=ensureBuiltInCategories(vault);masterKey=result.key;encryptionSalt=result.salt;if(categoryMigrated){try{await persist()}catch(e){vault=null;masterKey=null;encryptionSalt=null;throw Error('舊資料分類升級未能安全儲存，請確認儲存空間後重試：'+e.message)}}$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('app').classList.remove('recovery-mode');$('lockBtn').classList.remove('hidden');lastActive=Date.now();selectedCat='all';$('search').value='';$('memberFilter').value='all';resetBatch();render();$('master').value='';$('masterConfirm').value='';refreshRecoveryUI();notify('已解鎖');}
$('gateBtn').onclick=async()=>{const p=$('master').value;$('gateError').classList.add('hidden');if(!p)return creationError('請輸入主密碼','gateError');$('gateBtn').disabled=true;try{checkLocalSecurity();$('gateBtn').textContent='正在加密處理…';if(getEnvelope()){await unlock(p)}else{if(p.length<12)throw Error('主密碼至少需要 12 字元');if(p!==$('masterConfirm').value)throw Error('兩次輸入的主密碼不一致');encryptionSalt=crypto.getRandomValues(new Uint8Array(16));masterKey=await deriveKey(p,encryptionSalt);vault=emptyVault();await persist();$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('lockBtn').classList.remove('hidden');render();$('master').value='';$('masterConfirm').value='';notify('加密保險箱建立成功')}}catch(e){if(vault&&$('app').classList.contains('hidden')){vault=null;masterKey=null;encryptionSalt=null;}creationError(String(e.message||'建立失敗').includes('decrypt')?'主密碼不正確':(e.message||'建立失敗'),'gateError')}finally{$('gateBtn').disabled=false;$('gateBtn').textContent=getEnvelope()?'解鎖保險箱':'建立加密資料庫'}};
$('lockBtn').onclick=lock;
['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{if(vault)lastActive=Date.now()},{passive:true}));setInterval(()=>{if(vault&&Date.now()-lastActive>300000)lock()},15000);
function mname(id){return vault.members.find(x=>x.id===id)?.name||'未分類'}function cname(id){return vault.categories.find(x=>x.id===id)?.name||'其他'}function cat(id){return vault.categories.find(x=>x.id===id)||DEFAULT_CATS[7]}
function tab(t){if(t!=='records')resetBatch();if(!vault&&t!=='settings')return;for(const name of ['records','members','due','settings'])$(name+'Page').classList.toggle('hidden',name!==t);document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));if(t==='due')renderDue();if(t==='members')renderMembers();window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>tab(b.dataset.go));
function render(){if(!vault)return;updateBatchControls();updateCloudStatus();$('activeProfileBadge').textContent=(selectedProfile()?.name||'');$('countAll').textContent=vault.records.length;$('countMember').textContent=vault.members.length;$('countDue').textContent=vault.records.filter(r=>r.due&&r.due<=today()).length;renderSelects();renderCats();renderRecords();renderMembers();renderDue();if(smartOpen)refreshSmart();}
// 分類計數與清單共用同一個成員/搜尋條件，避免卡片數字與實際清單不一致。
function matchingRecords(category='all'){
 const q=$('search').value.trim().toLowerCase();
 const member=$('memberFilter').value||'all';
 return vault.records.filter(r=>(category==='all'||r.category===category)
  &&(member==='all'||r.member===member)
  &&[r.title,r.username,r.note,r.url].some(s=>String(s||'').toLowerCase().includes(q)));
}
// V1.8.6: presentation-only grouping. Category IDs and encrypted records remain unchanged.
const CAT_GROUPS=[
 {id:'finance',label:'金融與支付',icon:'bank',ids:['bank','invest','payment']},
 {id:'online',label:'網路與社群',icon:'cloud',ids:['email','social','cloud','shop']},
 {id:'life',label:'生活與民生',icon:'home',ids:['gov','health','travel','food','utility','home','device']},
 {id:'work',label:'工作與學習',icon:'gov',ids:['work','school']},
 {id:'fun',label:'娛樂與遊戲',icon:'game',ids:['game','stream']},
 {id:'misc',label:'其他與自訂',icon:'other',ids:['other']}
];
let openCatGroups=new Set(['finance']);
function groupForCat(id){return CAT_GROUPS.find(g=>g.ids.includes(id))?.id||'misc'}
function categoryTile(c){return `<button type="button" class="category ${selectedCat===c.id?'selected':''}" data-cat="${esc(c.id)}" aria-pressed="${selectedCat===c.id}"><span class="art" style="background:${/^#[0-9a-fA-F]{6}$/.test(c.color)?c.color:'#eaf0f6'}">${iconMarkup(c.icon,'lg',c.name)}</span><small>${esc(c.name)}</small><span class="num">${matchingRecords(c.id).length} 筆</span></button>`}
function renderCats(){
 const root=$('categories');
 const q=$('search').value.trim();
 const builtin=new Set(CAT_GROUPS.flatMap(g=>g.ids));
 const groups=CAT_GROUPS.map(g=>({...g,cats:vault.categories.filter(c=>g.id==='misc'?(g.ids.includes(c.id)||!builtin.has(c.id)):g.ids.includes(c.id))}));
 root.innerHTML=`<div class="cat-all">${categoryTile({id:'all',name:'全部分類',icon:'all',color:'#eaf0f6'})}</div><div class="cat-groups">${groups.filter(g=>g.cats.length).map(g=>{
  const count=g.cats.reduce((sum,c)=>sum+matchingRecords(c.id).length,0);
  const active=g.cats.some(c=>c.id===selectedCat);
  const expanded=openCatGroups.has(g.id)||active||Boolean(q);
  return `<details class="cat-group" data-group="${g.id}" ${expanded?'open':''}><summary><span class="cat-group-icon">${iconMarkup(g.icon,'md',g.label)}</span><span class="cat-group-label">${esc(g.label)}<small>${g.cats.length} 個分類</small></span><span class="cat-group-count">${count} 筆</span><span class="cat-group-arrow" aria-hidden="true">⌄</span></summary><div class="cat-group-grid">${g.cats.map(categoryTile).join('')}</div></details>`;
 }).join('')}</div>`;
 root.querySelectorAll('details.cat-group').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)openCatGroups.add(d.dataset.group);else openCatGroups.delete(d.dataset.group)}));
 root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{selectedCat=b.dataset.cat;batchSelected.clear();if(selectedCat!=='all')openCatGroups.add(groupForCat(selectedCat));renderCats();renderRecords();if(smartOpen)refreshSmart()});
}

function renderSelects(){const mf=$('memberFilter');const old=mf.value;mf.innerHTML='<option value="all">所有家人</option>'+vault.members.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');mf.value=[...mf.options].some(o=>o.value===old)?old:'all';$('rMember').innerHTML=vault.members.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');$('rCategory').innerHTML=vault.categories.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');const previous=$('batchCategory').value;$('batchCategory').innerHTML='<option value="">請選擇目標分類</option>'+vault.categories.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');if(vault.categories.some(c=>c.id===previous))$('batchCategory').value=previous;}
function card(r){const c=cat(r.category);return `<button class="record" data-rec="${esc(r.id)}"><span class="ricon" style="background:${/^#[0-9a-fA-F]{6}$/.test(c.color)?c.color:'#eef4f8'}">${iconMarkup(c.icon,'md',c.name)}</span><span class="rinfo"><strong>${esc(r.title)}</strong><small>${esc(mname(r.member))} · ${esc(r.username||'未填帳號')}${r.due&&r.due<=today()?' · 待檢查':''}</small></span><span class="chevron">${iconMarkup('arrow','sm')}</span></button>`;}
function bindCards(el){el.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>showDetail(b.dataset.rec));}
function renderRecords(){if(!vault)return;const items=matchingRecords(selectedCat).sort((a,b)=>a.title.localeCompare(b.title,'zh-Hant'));$('listTitle').textContent=`${selectedCat==='all'?'全部帳號':cname(selectedCat)}（${items.length}）`;$('records').innerHTML=items.length?items.map(r=>batchMode?`<div class="batch-record"><label class="batch-check"><input type="checkbox" data-batch-id="${esc(r.id)}" ${batchSelected.has(r.id)?'checked':''} aria-label="選取 ${esc(r.title)}"><span class="sr-only">選取 ${esc(r.title)}</span></label>${card(r)}</div>`:card(r)).join(''):'<div class="empty">🌱 還沒有符合條件的帳號，點選「新增帳號」開始整理。</div>';if(batchMode){$('records').querySelectorAll('[data-batch-id]').forEach(box=>box.onchange=()=>{if(box.checked)batchSelected.add(box.dataset.batchId);else batchSelected.delete(box.dataset.batchId);updateBatchControls()});$('records').querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{const id=b.dataset.rec;if(batchSelected.has(id))batchSelected.delete(id);else batchSelected.add(id);renderRecords()});}else bindCards($('records'));updateBatchControls();}

// V1.8.4: local, deterministic classification. Never analyze secrets or send records to a server.
// Domains are exact or subdomain matches, preventing lookalike domains from being classified.
const SMART_RULES=[
 {cat:'bank',hosts:['bot.com.tw','fubon.com','cathaybk.com.tw','esunbank.com','ctbcbank.com','taishinbank.com.tw','megabank.com.tw','firstbank.com.tw','landbank.com.tw'],words:['臺灣銀行','台灣銀行','國泰世華','玉山銀行','台新銀行','中國信託','兆豐銀行','第一銀行','土地銀行','富邦銀行']},
 {cat:'invest',hosts:['twse.com.tw','tpex.org.tw','sinotrade.com.tw','yuanta.com.tw','capital.com.tw','fubon.com.tw'],words:['元大證券','永豐金證券','富邦證券','凱基證券','國泰證券','群益證券','期貨交易']},
 {cat:'payment',hosts:['linepay.com.tw','jkopay.com','pxpay.com.tw','easywallet.com.tw'],words:['LINE Pay','街口支付','全支付','悠遊付','台灣pay']},
 {cat:'shop',hosts:['shopee.tw','momo.com.tw','pchome.com.tw','ruten.com.tw','amazon.com','rakuten.com.tw','costco.com.tw'],words:['蝦皮','momo購物','PChome','露天拍賣','樂天市場','好市多']},
 {cat:'social',hosts:['facebook.com','instagram.com','threads.net','discord.com','line.me','linkedin.com'],words:['Facebook','Instagram','Threads','Discord','LINE通訊','LinkedIn','臉書']},
 {cat:'gov',hosts:['gov.tw','govtaiwan.org'],words:['健保署','勞保局','監理服務網','自然人憑證','戶政事務所','財政部電子申報']},
 {cat:'email',hosts:['gmail.com','outlook.live.com','mail.google.com','mail.yahoo.com','proton.me'],words:['Gmail','Outlook','電子郵件','信箱帳號','Yahoo信箱','Proton Mail']},
 {cat:'game',hosts:['steampowered.com','store.steampowered.com','epicgames.com','roblox.com','nintendo.com','playstation.com'],words:['Steam','Epic Games','Roblox','任天堂帳號','PlayStation']},
 {cat:'stream',hosts:['netflix.com','disneyplus.com','spotify.com','youtube.com','twitch.tv','myvideo.net.tw','friday.tw'],words:['Netflix','Disney+','Spotify','YouTube','Twitch','MyVideo','friDay影音']},
 {cat:'cloud',hosts:['drive.google.com','dropbox.com','onedrive.live.com','icloud.com','box.com'],words:['Google Drive','Dropbox','OneDrive','iCloud雲端']},
 {cat:'work',hosts:['github.com','gitlab.com','slack.com','notion.so','figma.com','trello.com','atlassian.net'],words:['GitHub','GitLab','Slack','Notion','Figma','Trello']},
 {cat:'school',hosts:['coursera.org','udemy.com','duolingo.com','khanacademy.org'],words:['Coursera','Udemy','Duolingo','Khan Academy','學習平台']},
 {cat:'health',hosts:['nhi.gov.tw','health.gov.tw'],words:['醫院掛號','健康存摺','電子病歷']},
 {cat:'travel',hosts:['booking.com','agoda.com','airbnb.com','kkday.com','klook.com','thsrc.com.tw','railway.gov.tw'],words:['Booking.com','Agoda','Airbnb','KKday','Klook','台灣高鐵','台鐵訂票']},
 {cat:'food',hosts:['foodpanda.com.tw','ubereats.com','foodpanda.com'],words:['foodpanda','Uber Eats','外送平台']},
 {cat:'utility',hosts:['cht.com.tw','taiwanmobile.com','fetnet.net','taipower.com.tw','water.gov.tw'],words:['中華電信','台灣大哥大','遠傳電信','台灣電力','台灣自來水','台電帳號']},
 {cat:'device',hosts:['tplink.com','asusrouter.com','myqnapcloud.com','synology.com'],words:['TP-Link','ASUS Router','Synology','QNAP','監視器帳號','路由器管理']},
];
function smartHost(raw){try{if(!raw||!/^https?:\/\//i.test(raw.trim()))return '';return new URL(raw.trim()).hostname.toLowerCase().replace(/\.$/,'')}catch{return ''}}
function smartGuess(r){
 const host=smartHost(r.url||'');const title=String(r.title||'').normalize('NFKC').toLocaleLowerCase();
 const hits=[];
 for(const rule of SMART_RULES){
  // Prefer specific hosts; generic hosts shared across services cannot override a specific hostname.
  const matching=rule.hosts.filter(x=>host&&(host===x||host.endsWith('.'+x))).sort((a,b)=>b.length-a.length);
  if(matching.length)hits.push({cat:rule.cat,score:100+matching[0].length,reason:'網站網址'});
  else if(!host&&rule.words.some(w=>title.includes(w.normalize('NFKC').toLocaleLowerCase())))hits.push({cat:rule.cat,score:30,reason:'帳號名稱'});
 }
 if(!hits.length)return null;
 hits.sort((a,b)=>b.score-a.score);
 if(hits.length>1&&hits[0].score===hits[1].score)return null; // ambiguous: do not propose
 const chosen=hits[0];if(r.category===chosen.cat||!vault.categories.some(c=>c.id===chosen.cat))return null;
 return {id:r.id,to:chosen.cat,reason:chosen.reason};
}
// V1.8.6: form classification suggestions are local-only and never change a selected category automatically.
let editSuggestionDismissed=false;
function filterEditCategories(){
 const input=$('rCategorySearch');const select=$('rCategory');if(!vault||!select)return;
 const query=(input.value||'').trim().normalize('NFKC').toLocaleLowerCase();
 const current=select.value;
 const matches=vault.categories.filter(c=>c.name.normalize('NFKC').toLocaleLowerCase().includes(query));
 const visible=matches.length?matches:[];
 const options=visible.some(c=>c.id===current)?visible:[...visible,...vault.categories.filter(c=>c.id===current)];
 select.innerHTML=options.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}${query&&!matches.some(m=>m.id===c.id)?'（目前選擇）':''}</option>`).join('');
 if(options.some(c=>c.id===current))select.value=current;
 $('rCategorySearchHint').textContent=query?(matches.length?`找到 ${matches.length} 種分類，請從下拉選單選擇`:'沒有符合的分類；保留目前選擇，可清除搜尋重新挑選'):'可輸入關鍵字，快速縮小分類選單';
}
function refreshEditAdvice(){
 const root=$('editCategoryAdvice');if(!vault||!root||!$('editDialog').open||editSuggestionDismissed){root?.classList.add('hidden');return;}
 const current=$('rCategory').value;
 const guess=smartGuess({id:'form-preview',title:$('rTitle').value,url:$('rUrl').value,category:current});
 if(!guess){root.classList.add('hidden');return;}
 root.classList.remove('hidden');root.dataset.target=guess.to;
 $('editAdviceText').textContent=`依${guess.reason}，建議分類為「${cname(guess.to)}」；目前是「${cname(current)}」。`;
}
$('rCategorySearch').addEventListener('input',filterEditCategories);
$('rCategory').addEventListener('change',()=>{editSuggestionDismissed=true;$('editCategoryAdvice').classList.add('hidden')});
for(const id of ['rTitle','rUrl'])$(id).addEventListener('input',()=>{editSuggestionDismissed=false;refreshEditAdvice()});
$('editApplyAdvice').onclick=()=>{const target=$('editCategoryAdvice').dataset.target;if(!vault.categories.some(c=>c.id===target))return;$('rCategorySearch').value='';$('rCategory').innerHTML=vault.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$('rCategory').value=target;filterEditCategories();editSuggestionDismissed=true;$('editCategoryAdvice').classList.add('hidden');};
$('editDismissAdvice').onclick=()=>{editSuggestionDismissed=true;$('editCategoryAdvice').classList.add('hidden')};
let smartOpen=false,smartSaving=false;const smartSelected=new Set();let smartSuggestions=[];
function closeSmart(){smartOpen=false;smartSelected.clear();$('smartPanel').classList.add('hidden');$('smartToggle').setAttribute('aria-pressed','false')}
function refreshSmart(){
 if(!vault||!smartOpen)return;
 // Suggestions are limited to current member and search filters, across categories.
 smartSuggestions=matchingRecords('all').map(r=>({record:r,guess:smartGuess(r)})).filter(x=>x.guess);
 const ids=new Set(smartSuggestions.map(x=>x.record.id));for(const id of smartSelected)if(!ids.has(id))smartSelected.delete(id);
 $('smartSuggestions').innerHTML=smartSuggestions.length?smartSuggestions.map(({record:r,guess:g})=>`<label class="smart-item"><input type="checkbox" data-smart-id="${esc(r.id)}" ${smartSelected.has(r.id)?'checked':''} ${smartSaving?'disabled':''}><span><strong>${esc(r.title)}</strong><small>${esc(cname(r.category))} → ${esc(cname(g.to))} · 依${esc(g.reason)}建議</small></span></label>`).join(''):'<p class="hint">目前篩選範圍沒有明確且需要調整的分類建議。沒有建議的帳號保持原分類，可自行編輯。</p>';
 $('smartSuggestions').querySelectorAll('[data-smart-id]').forEach(x=>x.onchange=()=>{x.checked?smartSelected.add(x.dataset.smartId):smartSelected.delete(x.dataset.smartId);refreshSmartCount()});refreshSmartCount();
}
function refreshSmartCount(){$('smartCount').textContent=`已勾選 ${smartSelected.size}／${smartSuggestions.length} 筆`;$('smartApply').disabled=smartSaving||!smartSelected.size;$('smartSelectAll').disabled=smartSaving||!smartSuggestions.length;$('smartClear').disabled=smartSaving||!smartSelected.size}
$('smartToggle').onclick=()=>{if(smartSaving)return;smartOpen=!smartOpen;smartSelected.clear();$('smartPanel').classList.toggle('hidden',!smartOpen);$('smartToggle').setAttribute('aria-pressed',String(smartOpen));if(smartOpen){if(batchMode){batchMode=false;batchSelected.clear();renderRecords()}refreshSmart()}};
$('smartClose').onclick=closeSmart;
$('smartSelectAll').onclick=()=>{if(smartSaving)return;smartSuggestions.forEach(x=>smartSelected.add(x.record.id));refreshSmart()};
$('smartClear').onclick=()=>{if(smartSaving)return;smartSelected.clear();refreshSmart()};
$('smartApply').onclick=async()=>{
 if(smartSaving||!vault||!smartSelected.size)return;
 const changes=smartSuggestions.filter(x=>smartSelected.has(x.record.id)&&x.guess.to!==x.record.category);
 if(!changes.length)return notify('目前沒有可套用的建議');
 if(!confirm(`確定套用 ${changes.length} 筆智慧分類建議？\n只變更分類，其餘帳號資料不變。`))return;
 smartSaving=true;refreshSmartCount();const previous=changes.map(x=>({record:x.record,category:x.record.category,updatedAt:x.record.updatedAt}));const stamp=new Date().toISOString();
 for(const x of changes){x.record.category=x.guess.to;x.record.updatedAt=stamp}
 try{await persist();smartSelected.clear();render();refreshSmart();notify(`已成功重新分類 ${changes.length} 筆帳號`)}
 catch(e){for(const x of previous){x.record.category=x.category;x.record.updatedAt=x.updatedAt}render();refreshSmart();notify('智慧分類未成功儲存，已還原變更：'+e.message)}
 finally{smartSaving=false;refreshSmartCount()}
};

$('batchToggle').onclick=()=>{if(batchSaving)return;batchMode=!batchMode;batchSelected.clear();if(batchMode)closeSmart();renderRecords()};
$('batchSelectAll').onclick=()=>{if(batchSaving)return;matchingRecords(selectedCat).forEach(r=>batchSelected.add(r.id));renderRecords()};
$('batchClear').onclick=()=>{if(batchSaving)return;batchSelected.clear();renderRecords()};
$('batchCategory').onchange=updateBatchControls;
$('batchApply').onclick=async()=>{if(batchSaving||!vault||!batchSelected.size)return;const target=$('batchCategory').value;const category=vault.categories.find(c=>c.id===target);if(!category)return notify('請選擇有效的目標分類');const ids=new Set(batchSelected),changed=vault.records.filter(r=>ids.has(r.id)&&r.category!==target);if(!changed.length)return notify('選取的帳號已在這個分類，無須移動');if(!confirm(`確定將 ${changed.length} 筆帳號移至「${category.name}」？\n僅變更分類，其他內容保持不變。`))return;batchSaving=true;updateBatchControls();const previous=changed.map(r=>({record:r,category:r.category,updatedAt:r.updatedAt}));const stamp=new Date().toISOString();for(const r of changed){r.category=target;r.updatedAt=stamp;}try{await persist();batchSelected.clear();render();notify(`已將 ${changed.length} 筆帳號移至「${category.name}」`)}catch(e){for(const x of previous){x.record.category=x.category;x.record.updatedAt=x.updatedAt;}render();notify('批次分類儲存失敗，已復原畫面資料：'+e.message)}finally{batchSaving=false;updateBatchControls()}};
function renderMembers(){$('members').innerHTML=vault.members.map(m=>`<div class="member"><span class="ricon">${iconMarkup(m.icon||'person','md',m.name)}</span><span class="rinfo"><strong>${esc(m.name)}</strong><small>${vault.records.filter(r=>r.member===m.id).length} 筆帳號</small></span></div>`).join('');}
function renderDue(){const items=vault.records.filter(r=>r.due&&r.due<=today());$('dueList').innerHTML=items.length?items.map(card).join(''):'<div class="empty">🌷 目前沒有到期需要檢查的帳號。</div>';bindCards($('dueList'));}
$('search').oninput=()=>{batchSelected.clear();renderCats();renderRecords();if(smartOpen)refreshSmart()};$('memberFilter').onchange=()=>{batchSelected.clear();renderCats();renderRecords();if(smartOpen)refreshSmart()};
function openEdit(id=null){const r=id?vault.records.find(x=>x.id===id):null;$('editHeading').textContent=r?'編輯帳號':'新增帳號';$('editId').value=r?.id||'';$('rTitle').value=r?.title||'';$('rUser').value=r?.username||'';$('rPassword').value=r?.password||'';$('rPassword').type='password';$('rTransactionPassword').value=r?.transactionPassword||'';$('rTransactionPassword').type='password';$('rTransactionChanged').value=r?.transactionChanged||'';$('rUrl').value=r?.url||'';$('rChanged').value=r?.changed||today();$('rDue').value=r?.due||'';$('rNote').value=r?.note||'';$('rSecurityQuestion').value=r?.securityQuestion||'';$('rSecurityAnswer').value=r?.securityAnswer||'';$('rSecurityAnswer').type='password';$('rSecurityPin').value=r?.securityPin||'';$('rSecurityPin').type='password';$('rSecurityPinChanged').value=r?.securityPinChanged||'';$('rRecoveryContact').value=r?.recoveryContact||'';$('rRecoveryCodes').value=r?.recoveryCodes||'';$('rRecoveryCodes').classList.remove('recovery-visible');$('toggleRecoveryCodes').textContent='顯示';document.querySelectorAll('[data-toggle-secret]').forEach(b=>b.textContent='顯示');renderSelects();$('rMember').value=vault.members.some(m=>m.id===(r?.member||'self'))?(r?.member||'self'):(vault.members[0]?.id||'');$('rCategory').value=r?.category||(selectedCat==='all'?'other':selectedCat);$('rCategorySearch').value='';editSuggestionDismissed=false;filterEditCategories();$('editCategoryAdvice').classList.add('hidden');$('advancedSecurity').open=false;markEditPristine();$('editDialog').showModal();$('editDialog').querySelector('.dialogbody').scrollTop=0;refreshEditAdvice();}
$('addRecord').onclick=()=>openEdit();$('togglePassword').onclick=()=>{$('rPassword').type=$('rPassword').type==='password'?'text':'password'};
$('toggleTransactionPassword').onclick=()=>{const field=$('rTransactionPassword');const visible=field.type==='password';field.type=visible?'text':'password';$('toggleTransactionPassword').textContent=visible?'隱藏':'顯示'};
document.querySelectorAll('[data-toggle-secret]').forEach(button=>button.onclick=()=>{const el=$(button.dataset.toggleSecret);if(!el)return;el.type=el.type==='password'?'text':'password';button.textContent=el.type==='password'?'顯示':'隱藏'});
$('toggleRecoveryCodes').onclick=()=>{const e=$('rRecoveryCodes');const visible=e.classList.toggle('recovery-visible');$('toggleRecoveryCodes').textContent=visible?'隱藏':'顯示'};
$('generatePassword').onclick=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*_-';const result=[];while(result.length<24){const buf=crypto.getRandomValues(new Uint8Array(32));for(const x of buf){if(x<Math.floor(256/chars.length)*chars.length)result.push(chars[x%chars.length]);if(result.length===24)break}}$('rPassword').value=result.join('');$('rPassword').type='text';notify('已產生 24 字元隨機密碼');};
$('recordForm').onsubmit=async e=>{e.preventDefault();const submit=$('recordForm').querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;try{await saveRecordFromForm()}finally{submit.disabled=false}};
async function saveRecordFromForm(){const id=$('editId').value;const old=id?vault.records.find(x=>x.id===id):null;const changed=$('rChanged').value||today();const password=$('rPassword').value;const history=structuredClone(old?.history||[]);if(old&&old.password!==password&&old.password){history.unshift({password:old.password,changed:old.changed||'',savedAt:new Date().toISOString()})}const transactionPassword=$('rTransactionPassword').value;const transactionChanged=$('rTransactionChanged').value||((old?.transactionPassword||'')===transactionPassword?(old?.transactionChanged||''):(transactionPassword?today():''));const transactionHistory=structuredClone(old?.transactionHistory||[]);if(old&&(old.transactionPassword||'')!==transactionPassword&&old.transactionPassword){transactionHistory.unshift({password:old.transactionPassword,changed:old.transactionChanged||'',savedAt:new Date().toISOString()})}const securityPin=$('rSecurityPin').value;
const securityPinChanged=$('rSecurityPinChanged').value||((old?.securityPin||'')===securityPin?(old?.securityPinChanged||''):(securityPin?today():''));
const securityPinHistory=structuredClone(old?.securityPinHistory||[]);
if(old&&(old.securityPin||'')!==securityPin&&old.securityPin){securityPinHistory.unshift({password:old.securityPin,changed:old.securityPinChanged||'',savedAt:new Date().toISOString()})}
if(!vault.members.some(m=>m.id===$('rMember').value)||!vault.categories.some(c=>c.id===$('rCategory').value))return notify('請重新選擇有效的家庭成員與分類');const r={id:id||uid(),title:$('rTitle').value.trim(),member:$('rMember').value,category:$('rCategory').value,username:$('rUser').value.trim(),password,transactionPassword,transactionChanged,transactionHistory,securityQuestion:$('rSecurityQuestion').value.trim(),securityAnswer:$('rSecurityAnswer').value,securityPin,securityPinChanged,securityPinHistory,recoveryContact:$('rRecoveryContact').value.trim(),recoveryCodes:$('rRecoveryCodes').value.trim(),url:$('rUrl').value.trim(),changed,due:$('rDue').value,note:$('rNote').value.trim(),history,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(!r.title)return notify('請填寫名稱');const before=old?structuredClone(old):null;if(old)Object.assign(old,r);else vault.records.push(r);try{await persist();$('editDialog').close();render();notify('已安全儲存於本機')}catch(ex){if(old)Object.assign(old,before);else vault.records=vault.records.filter(x=>x.id!==r.id);notify('儲存失敗：'+ex.message)}}
function secretText(secret){return secret?'••••••••':'未設定'}
function secretRow(secret,id){return `<div class="secret"><code id="${id}">${secretText(secret)}</code>${secret?`<button class="soft sm" data-show="${id}">顯示</button><button class="soft sm" data-copy="${id}">複製</button>`:''}</div>`;}
function recordSecretValue(r,id){if(id==='current')return r.password||'';if(id==='transactionCurrent')return r.transactionPassword||'';if(id==='securityAnswer')return r.securityAnswer||'';if(id==='securityPin')return r.securityPin||'';if(id==='recoveryCodes')return r.recoveryCodes||'';if(/^pinhist\d+$/.test(id))return r.securityPinHistory?.[Number(id.slice(7))]?.password||'';if(/^transhist\d+$/.test(id))return r.transactionHistory?.[Number(id.slice(9))]?.password||'';if(/^hist\d+$/.test(id))return r.history?.[Number(id.slice(4))]?.password||'';return '';}
function showDetail(id){const r=vault.records.find(x=>x.id===id);if(!r)return;selectedRecord=id;$('detailTitle').innerHTML=`<span class="titleicon">${iconMarkup(cat(r.category).icon,'md',cat(r.category).name)}</span><span>${esc(r.title)}</span>`;const url=/^https:\/\//i.test(r.url||'')?r.url:'';$('detailContent').innerHTML=`<div class="dfield"><div class="lab">所屬家人 / 分類</div><div class="val">${esc(mname(r.member))} · ${esc(cname(r.category))}</div></div><div class="dfield"><div class="lab">帳號 / Email</div><div class="val">${esc(r.username||'未設定')} ${r.username?'<button class="soft sm" data-copyuser>複製</button>':''}</div></div><div class="dfield"><div class="lab">目前密碼</div>${secretRow(r.password,'current')}</div><div class="dfield transaction-detail"><div class="lab">網路交易密碼</div>${secretRow(r.transactionPassword||'','transactionCurrent')}<div class="hint">交易密碼更換日期：${fmt(r.transactionChanged)}</div></div><div class="dfield"><div class="lab">最後更換日期</div><div class="val">${fmt(r.changed)}</div></div><div class="dfield"><div class="lab">下次檢查日期</div><div class="val">${fmt(r.due)}</div></div>${url?`<div class="dfield"><div class="lab">網站</div><a class="link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">開啟登入網站 ↗</a></div>`:''}${r.note?`<div class="dfield"><div class="lab">備註</div><div class="val">${esc(r.note)}</div></div>`:''}<div class="dfield"><h3>密碼歷史紀錄（${r.history?.length||0}）</h3>${(r.history||[]).map((h,i)=>`<div class="history"><small>第 ${r.history.length-i} 筆歷史 · 密碼日期 ${fmt(h.changed)}</small>${secretRow(h.password,'hist'+i)}</div>`).join('')||'<p class="hint">尚無舊密碼紀錄</p>'}</div><div class="dfield transaction-detail"><h3>交易密碼歷史紀錄（${r.transactionHistory?.length||0}）</h3>${(r.transactionHistory||[]).map((h,i)=>`<div class="history"><small>交易密碼歷史 · 更換日期 ${fmt(h.changed)}</small>${secretRow(h.password,'transhist'+i)}</div>`).join('')||'<p class="hint">尚無舊交易密碼紀錄</p>'}</div><div class="dfield advanced-detail"><h3>進階安全資訊</h3><div class="lab">安全問題</div><div class="val">${esc(r.securityQuestion||'未設定')}</div><div class="lab">安全問題答案</div>${secretRow(r.securityAnswer||'','securityAnswer')}<div class="lab">PIN 碼</div>${secretRow(r.securityPin||'','securityPin')}<p class="hint">PIN 更換日期：${fmt(r.securityPinChanged)}</p><div class="lab">備用驗證資訊</div><div class="val multiline">${esc(r.recoveryContact||'未設定')}</div><div class="lab">恢復代碼</div>${secretRow(r.recoveryCodes||'','recoveryCodes')}<p class="hint">已使用的恢復代碼請手動移除或更新。</p></div><div class="dfield"><h3>PIN 歷史紀錄（${r.securityPinHistory?.length||0}）</h3>${(r.securityPinHistory||[]).map((h,i)=>`<div class="history"><small>PIN 更換日期 ${fmt(h.changed)}</small>${secretRow(h.password,'pinhist'+i)}</div>`).join('')||'<p class="hint">尚無舊 PIN 紀錄</p>'}</div>`;
$('detailContent').querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const element=$(b.dataset.show);const secret=recordSecretValue(r,b.dataset.show);element.textContent=element.textContent===secret?'••••••••':secret;b.textContent=element.textContent===secret?'隱藏':'顯示'});
$('detailContent').querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const secret=recordSecretValue(r,b.dataset.copy);copySecret(secret)});
const copyuser=$('detailContent').querySelector('[data-copyuser]');if(copyuser)copyuser.onclick=()=>copySecret(r.username);$('detailDialog').showModal();}
async function copySecret(v){try{await navigator.clipboard.writeText(v||'');notify('已複製；使用後請自行清除剪貼簿，其他應用程式可能讀取')}catch{notify('無法複製，請使用 HTTPS 網址開啟')}}
$('editRecord').onclick=()=>{$('detailDialog').close();openEdit(selectedRecord)};
$('deleteRecord').onclick=async()=>{if(!vault||!selectedRecord)return;if(!confirm('確定永久刪除這筆帳號及全部舊密碼歷史？'))return;const prior=vault.records;vault.records=vault.records.filter(x=>x.id!==selectedRecord);try{await persist();$('detailDialog').close();render();notify('帳號已刪除')}catch(e){vault.records=prior;notify('刪除失敗：'+e.message)}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function openSmall(mode){smallMode=mode;$('smallHeading').textContent=mode==='member'?'新增家庭成員':'自訂帳號分類';$('smallLabel').textContent=mode==='member'?'成員稱呼':'分類名稱';$('smallName').value='';$('smallEmoji').value='';$('smallDialog').showModal();}
$('addMember').onclick=()=>openSmall('member');$('addCategory').onclick=()=>openSmall('category');
$('smallForm').onsubmit=async e=>{e.preventDefault();const name=$('smallName').value.trim();if(!name)return;const icon=$('smallEmoji').value.trim()||(smallMode==='member'?'person':'other');const kind=smallMode==='member'?'members':'categories';const item=kind==='members'?{id:uid(),name,icon}:{id:uid(),name,icon,color:'#e7f0f4'};const btn=$('smallForm').querySelector('[type=submit]');btn.disabled=true;vault[kind].push(item);try{await persist();$('smallDialog').close();render();notify('已新增')}catch(err){vault[kind]=vault[kind].filter(x=>x.id!==item.id);notify('新增失敗，未保存變更：'+err.message)}finally{btn.disabled=false}};
function backupFilename(){
 const d=new Date(), pad=n=>String(n).padStart(2,'0');
 return `拾光密碼_加密備份_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}
function encryptedBlob(obj){return new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})}
function downloadFile(obj){const blob=encryptedBlob(obj),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=backupFilename();document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}
async function backupEnvelope(){
 if(!vault||!activeProfileId)throw Error('請先解鎖自己的保險箱');
 if(!await settleCurrentWrites())throw Error('目前有儲存尚未完成，請稍後再試');
 const obj=await readPersistedEnvelope(activeProfileId);if(envelopeRaw(obj)!==envelopeRaw(getEnvelope()))throw Error('其他分頁已更新保險箱，請重新解鎖後再備份');if(!validateEnvelope(obj))throw Error('本機尚無有效的加密備份資料');
 // Verify that the persisted ciphertext is decryptable with the current active key,
 // and that the latest saved snapshot matches the currently unlocked vault.
 const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(obj.iv)},masterKey,unb64(obj.data));
 const disk=JSON.parse(new TextDecoder().decode(raw));
 if(!validateVault(disk))throw Error('已儲存的加密檔資料格式異常，取消匯出');
 if(JSON.stringify({...disk,updatedAt:null})!==JSON.stringify({...vault,updatedAt:null}))throw Error('本機資料與已加密儲存內容不一致，請重新儲存後再備份');
 return obj;
}
function markExport(){setCloudPrefs({lastExport:new Date().toISOString()});updateCloudStatus()}
$('exportBtn').onclick=async()=>{try{const obj=await backupEnvelope();downloadFile(obj);markExport();notify('已產生加密檔，請確認下載完成並自行存進 Google Drive')}catch(err){notify('匯出失敗：'+err.message)}};
$('shareBackup').onclick=async()=>{
 try{
  const obj=await backupEnvelope();const file=new File([encryptedBlob(obj)],backupFilename(),{type:'application/json'});
  if(!navigator.share||!navigator.canShare?.({files:[file]})){
   downloadFile(obj);markExport();notify('此裝置不支援檔案分享，已改用下載；請自行上傳 Google Drive');return;
  }
  await navigator.share({files:[file],title:'拾光密碼管家加密備份'});
  markExport();notify('已交給系統分享功能，請確認 Google Drive 實際儲存成功');
 }catch(e){if(e.name==='AbortError')return;notify('分享未完成：'+e.message)}
};

async function restoreObject(obj){
 if(!await settleCurrentWrites())throw Error('本機資料尚未儲存成功，已取消還原');
 if(!validateEnvelope(obj))throw Error('不是有效的拾光加密備份');
 const restoreProfile=activeProfileId;
 if(!restoreProfile)throw Error('請先選擇要還原的本機使用者');
 const pass=prompt('請輸入備份檔原本的主密碼，用於解密驗證：');
 if(pass===null)return;
 const parsed=await dec(obj,pass);
 if(restoreProfile!==activeProfileId)throw Error('還原期間使用者已切換');
 // Read the authoritative persisted envelope, not a possibly stale tab cache.
 const old=await readPersistedEnvelope(restoreProfile).catch(e=>{if(getEnvelope())throw e;return null}), prior=old?JSON.stringify(old):null;
 const summary=`備份驗證成功：${parsed.data.records.length} 筆帳號、${parsed.data.members.length} 位成員。\n還原將覆蓋此使用者目前的資料及密碼歷史。\n舊資料會先保留在本裝置的加密安全副本（不是雲端備份）。確定繼續？`;
 if(!confirm(summary))return;
 // The restore must fail rather than overwriting changes made in another tab.
 if(envelopeRaw(getEnvelope())!==envelopeRaw(old))throw Error('其他分頁已修改保險箱，請重新解鎖後再還原');
 if(prior&&prior!==JSON.stringify(obj)){
  const rollbackKey='shiguang-vault-restore-safety-'+restoreProfile+'-'+Date.now()+'-'+crypto.randomUUID();
  try{await safeWrite(rollbackKey,prior);const roundtrip=globalThis.indexedDB?await idbValue('get',rollbackKey):localStorage.getItem(rollbackKey);if(roundtrip!==prior)throw Error('無法驗證安全副本')}
  catch{throw Error('無法安全保存還原前資料，已取消還原。請先匯出現有加密備份。')}
 }
 try{await atomicEnvelopeWrite(restoreProfile,obj,old)}
 catch(err){
  // Do not replace in-memory data if durable verification failed.
  // An on-disk copy might have been written: try to restore the old envelope.
  if(old){try{const actual=await readPersistedEnvelope(restoreProfile);if(envelopeRaw(actual)===envelopeRaw(obj))await atomicEnvelopeWrite(restoreProfile,old,obj)}catch{throw Error('還原驗證失敗，請保留安全副本及目前網站資料。'+err.message)}}
  throw err;
 }
 vault=parsed.data;resetBatch();const upgradedCategories=ensureBuiltInCategories(vault);masterKey=parsed.key;encryptionSalt=parsed.salt;
 if(upgradedCategories){try{await persist()}catch(error){
  let rollbackFailure=null;
  if(old){try{const actual=await readPersistedEnvelope(restoreProfile);if(envelopeRaw(actual)===envelopeRaw(getEnvelope()))await atomicEnvelopeWrite(restoreProfile,old,actual)}catch(e){rollbackFailure=e}}
  // Stop presenting uncommitted imported content as the current vault.
  vault=null;masterKey=null;encryptionSalt=null;resetBatch();clearSensitiveUI();gateMode();
  if(rollbackFailure)throw Error('分類升級儲存失敗，原始加密資料無法確認復原；請保留網站資料與備份檔：'+rollbackFailure.message);
  throw Error('備份還原後的分類升級失敗，請重新解鎖或重試：'+error.message)
 }}
 setCloudPrefs({lastLocalChange:new Date().toISOString(),lastExport:null});stopAutoBackup();updateCloudStatus();
 $('gate').classList.add('hidden');$('app').classList.remove('hidden');$('lockBtn').classList.remove('hidden');$('app').classList.remove('recovery-mode');
 render();tab('records');notify('加密備份已驗證並還原成功');return true;
}
for(const id of ['importFile','gateFile'])$(id).onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>12000000){notify('備份檔太大');return}try{await restoreObject(JSON.parse(await f.text()))}catch(err){if(vault){await lockAfterUncertainWrite()}notify('還原失敗：'+(err.name==='OperationError'?'主密碼不正確或備份已損壞':err.message))}finally{e.target.value=''}};
$('importBtn').onclick=()=>$('importFile').click();$('gateImport').onclick=()=>$('gateFile').click();
$('changeMaster').onclick=async()=>{
 if(!vault||!activeProfileId)return notify('請先解鎖保險箱');
 if(!await settleCurrentWrites())return;
 const oldPassword=prompt('為防止他人誤操作，請先輸入目前的主密碼');if(oldPassword===null)return;
 try{await dec(getEnvelope(),oldPassword)}catch{return notify('目前主密碼不正確，未更動任何資料')}
 const p=prompt('輸入新的主密碼（至少 12 字元）');if(p===null)return;
 if(p.length<12)return notify('新主密碼至少需要 12 字元');
 const p2=prompt('再次輸入新的主密碼');if(p!==p2)return notify('兩次輸入不一致');
 if(p===oldPassword)return notify('新主密碼不可與原主密碼相同');
 if(!confirm('舊備份仍需使用舊主密碼。變更後請立即重新匯出加密備份並妥善保存。確定更換？'))return;
 const oldKey=masterKey,oldSalt=encryptionSalt,oldEnvelope=getEnvelope();
 const newSalt=crypto.getRandomValues(new Uint8Array(16)),newKey=await deriveKey(p,newSalt);
 encryptionSalt=newSalt;masterKey=newKey;
 try{
  await persist();
  // Verify newly persisted encrypted envelope actually opens with new password.
  await dec(await readPersistedEnvelope(activeProfileId),p);
  notify('主密碼已安全變更；請立即重新備份');
 }catch(e){
  masterKey=oldKey;encryptionSalt=oldSalt;
  try{
   if(oldEnvelope){
    const actual=await readPersistedEnvelope(activeProfileId);
    if(envelopeRaw(actual)!==envelopeRaw(oldEnvelope)){
     // Only restore if the new ciphertext was produced by this tab; never
     // overwrite a different tab's successful edit.
     if(!staleProfiles.has(activeProfileId)){
      const newPlain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(actual.iv)},newKey,unb64(actual.data)).catch(()=>null);
      if(newPlain)await atomicEnvelopeWrite(activeProfileId,oldEnvelope,actual);
      else throw Error('磁碟資料與本次變更不符，禁止覆蓋');
     }
    }
   }
  }catch{await lockAfterUncertainWrite();notify('主密碼變更未完成，無法安全自動還原。請勿清除網站資料：'+e.message);return}
  await lockAfterUncertainWrite();
  notify('主密碼變更未完成，已鎖定保險箱，請重新解鎖確認：'+e.message);
 }
};
// V1.7.9: OAuth-free offline backup. Import/export is implemented above.
$('showRecovery').onclick=()=>{$('recoveryGuide').classList.toggle('hidden');if(!$('recoveryGuide').classList.contains('hidden'))$('recoveryGuide').scrollIntoView({behavior:'smooth',block:'nearest'})};

async function inspectStorage(){
 const rows=[];let dbOk=false;
 try{const db=await openVaultDB();dbOk=!!db;rows.push('IndexedDB：可開啟')}catch(e){rows.push('IndexedDB：無法開啟（'+e.message+'）')}
 try{if(navigator.storage?.estimate){const x=await navigator.storage.estimate();rows.push('網站儲存估計：'+Math.round((x.usage||0)/1024)+' KB / 約 '+Math.round((x.quota||0)/1024/1024)+' MB')}else rows.push('此瀏覽器不提供容量估計')}catch(e){rows.push('無法查詢容量：'+e.message)}
 rows.push('目前使用者：'+(activeProfileId?'已選擇':'尚未選擇'));
 rows.push('加密保險箱：'+(getEnvelope()?'存在':'本機尚無資料'));
 if(activeProfileId){
  const name=keyName();
  try{const fromDb=globalThis.indexedDB?await idbValue('get',name):null;
   const fromLegacy=localStorage.getItem(name);
   rows.push('目前使用者加密檔位置：'+(fromDb?'IndexedDB':fromLegacy?'舊版 localStorage':'未找到'));
  }catch(e){rows.push('加密檔位置查詢失敗：'+e.message)}
 }
 rows.push('系統不會自動清除任何資料。');
 $('storageHealth').textContent=rows.join('\n');
}
async function runSelfTest(){
 const btn=$('runSelfTest'),box=$('selfTestResult');btn.disabled=true;box.textContent='正在檢查…';const results=[];
 try{
  if(!crypto?.subtle)throw Error('此網頁環境不支援 Web Crypto');
  const pass='Testing Only — '+crypto.randomUUID();
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await deriveKey(pass,salt);
  const sample=emptyVault();sample.records.push({id:'test-record',title:'測試資料',password:'not-a-real-password',history:[],transactionPassword:'test-pin',transactionHistory:[],securityPin:'0000',securityPinHistory:[]});
  const encrypted=await enc(sample,key,salt);
  const decoded=await dec(encrypted,pass);
  if(decoded.data.records[0].password!==sample.records[0].password)throw Error('加解密結果不一致');
  results.push('✓ AES-GCM 加密／解密：通過');
  const written=JSON.stringify(encrypted);
  await idbValue('put',testStorageKey,written);
  const read=await idbValue('get',testStorageKey);
  if(read!==written)throw Error('IndexedDB 寫入／讀取不一致');
  results.push('✓ IndexedDB 寫入／讀回：通過');
  try{await dec(encrypted,'incorrect test password');throw Error('錯誤密碼竟可解鎖')}catch(e){if(e.message==='錯誤密碼竟可解鎖')throw e}
  results.push('✓ 錯誤密碼拒絕解密：通過');
  results.push('✓ 測試未讀取或修改您的真實保險箱');
 }catch(e){results.push('✕ 測試失敗：'+String(e.message||e))}
 finally{try{await idbValue('delete',testStorageKey)}catch(e){results.push('注意：測試資料清理失敗：'+e.message)}box.textContent=results.join('\n');btn.disabled=false}
}
$('runSelfTest').onclick=runSelfTest;
$('checkStorage').onclick=inspectStorage;

if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});


// V1.7.8: mobile editing guard and app update lifecycle.
let editInitialState='';
function editFingerprint(){const f=$('recordForm');return JSON.stringify([...f.querySelectorAll('input,select,textarea')].map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));}
function markEditPristine(){editInitialState=editFingerprint()}
function editIsDirty(){return $('editDialog')?.open&&editInitialState!==editFingerprint()}
function safeEditDismiss(){if(!editIsDirty())return true;return confirm('有尚未儲存的修改，確定放棄並離開？')}
$('editDialog').addEventListener('cancel',e=>{if(!safeEditDismiss())e.preventDefault()});
// Existing data-close handlers close dialogs; interception must happen in capture phase.
$('editDialog').addEventListener('click',e=>{if(e.target.closest('[data-close="editDialog"]')&&!safeEditDismiss()){e.stopImmediatePropagation();e.preventDefault()}},true);
let updateReady=false, serviceWorkerReg=null;
function announcePwaUpdate(message='有新版介面可以更新，請先儲存正在編輯的資料。'){
 updateReady=true;$('pwaUpdateText').textContent=message;$('pwaUpdateBar').classList.remove('hidden');
}
$('pwaUpdateDismiss').onclick=()=>$('pwaUpdateBar').classList.add('hidden');
$('pwaUpdateBtn').onclick=async()=>{
 if(editIsDirty()){notify('請先儲存或放棄帳號修改後再更新');return}
 if([...document.querySelectorAll('dialog[open]')].length){notify('請先關閉編輯視窗再更新');return}
 if(typeof settleCurrentWrites==='function'&&!await settleCurrentWrites()){notify('本機儲存尚未完成，請稍後再更新');return}
 const waiting=serviceWorkerReg?.waiting;
 if(waiting){
  let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloaded){reloaded=true;location.reload()}},{once:true});
  waiting.postMessage({type:'SKIP_WAITING_AFTER_USER_CONFIRMATION'});
 }else location.reload();
};
// Update checks never access or modify passwords; they only detect a new service worker.
if('serviceWorker' in navigator && location.protocol==='https:'){
 navigator.serviceWorker.ready.then(reg=>{
  serviceWorkerReg=reg;
  if(reg.waiting)announcePwaUpdate();
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;if(!worker)return;
   worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)announcePwaUpdate()});
  });
  const check=()=>reg.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 }).catch(()=>{});
 let previousController=navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(previousController)announcePwaUpdate('網站程式已更新，請儲存資料後重新載入。');
  previousController=navigator.serviceWorker.controller;
 });
}

initProfiles().catch(e=>{
 console.error('保險箱啟動失敗',e);
 $('profilePicker').classList.remove('hidden');$('gate').classList.add('hidden');$('app').classList.add('hidden');
 $('createProfile').disabled=true;$('profileCreateForm').classList.add('hidden');
 const warning=$('profileCreateError');warning.textContent='讀取本機使用者失敗，已停止操作以保護原始資料。請勿清除網站資料；保留既有加密備份。詳細原因：'+e.message;warning.classList.remove('hidden');
 notify('讀取失敗，已停止操作以保護原始資料');
});
