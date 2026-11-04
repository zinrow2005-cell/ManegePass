'use strict';
const $=id=>document.getElementById(id);
const DEFAULT_CATS=[['bank','金融銀行','bank','#e2f0ff'],['shop','購物平台','shop','#ffe9ee'],['social','社群通訊','social','#e8f6e9'],['gov','政府服務','gov','#ede9ff'],['email','電子郵件','email','#fff1d8'],['game','遊戲娛樂','game','#fbe5f4'],['home','家庭生活','home','#e5f4f5'],['other','其他帳號','other','#ebf0f5']].map(([id,name,icon,color])=>({id,name,icon,color}));
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
async function saveEnvelope(id,envelope){
 const key='shiguang-vault-data-v2-'+id;
 await safeWrite(key,JSON.stringify(envelope));
 envelopeCache.set(key,envelope);
}

const cloudPrefKey=()=> 'shiguang-cloud-pref-v13-'+activeProfileId;
function cloudPrefs(){try{return JSON.parse(localStorage.getItem(cloudPrefKey())||'{}')}catch{return {}}}
function setCloudPrefs(patch){try{localStorage.setItem(cloudPrefKey(),JSON.stringify({...cloudPrefs(),...patch}))}catch(e){console.warn('雲端設定狀態暫無法保存',e?.name)}}
let autoBackupTimer=null, cloudBusy=false;
const CLOUD_MAX_RETRIES=2;
function isRetryableCloudError(e){return /網路|連線中斷|Failed to fetch|NetworkError|Google API (429|500|502|503|504)/i.test(String(e?.message||e))}
function cloudDelay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function retryCloudRead(task){let last;for(let attempt=0;attempt<=CLOUD_MAX_RETRIES;attempt++){try{return await task()}catch(e){last=e;if(!isRetryableCloudError(e)||attempt===CLOUD_MAX_RETRIES)break;await cloudDelay(700*(attempt+1))}}throw last}
function markBackupError(err){setCloudPrefs({lastError:String(err.message||err).slice(0,180)});updateCloudStatus('⚠️ 雲端備份未成功：'+String(err.message||err).slice(0,115))}
function refreshRecoveryUI(){const hint=$('connectionHint');if(hint)hint.textContent=googleEmail?'已授權：'+googleEmail:'尚未授權 Google，請先連線'}
function stopAutoBackup(){if(autoBackupTimer)clearTimeout(autoBackupTimer);autoBackupTimer=null}
function queueAutoBackup(){stopAutoBackup();if(!vault||!activeProfileId||!cloudPrefs().auto||cloudPrefs().autoPaused)return;updateCloudStatus();autoBackupTimer=setTimeout(async()=>{autoBackupTimer=null;if(!vault||!cloudPrefs().auto||cloudPrefs().autoPaused)return;if(!token||googleEmail!==selectedProfile()?.googleEmail){updateCloudStatus('待連接 Google；本機已加密儲存');return}try{await uploadCloud(true)}catch(e){markBackupError(e);notify('自動備份未完成，可在設定頁手動重試')}},3500)}
function updateCloudStatus(note){const el=$('backupStatus');if(!el)return;const pref=cloudPrefs();let line=note|| (pref.lastBackup?'上次成功雲端備份：'+new Date(pref.lastBackup).toLocaleString('zh-TW',{hour12:false}):'這個使用者尚無成功備份紀錄');if(vault&&pref.lastLocalChange&&(!pref.lastBackup||pref.lastLocalChange>pref.lastBackup))line+=' · 本機有尚未備份的修改';if(pref.lastError)line+=' · 上次失敗：'+pref.lastError;el.textContent=line;const retry=$('retryBackup');if(retry)retry.disabled=cloudBusy||!vault;const sw=$('autoBackup');if(sw)sw.checked=!!pref.auto;}

function selectedProfile(){return profiles.find(p=>p.id===activeProfileId)}
async function saveProfiles(){await safeWrite(PROFILES_KEY,JSON.stringify(profiles))}
async function initProfiles(){
 try{
  let raw=null;
  try{raw=await idbValue('get',PROFILES_KEY)}catch{}
  if(!raw){try{raw=localStorage.getItem(PROFILES_KEY)}catch{}}
  profiles=JSON.parse(raw||'[]');if(!Array.isArray(profiles))profiles=[];
 }catch{profiles=[]}
 profiles=profiles.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string');
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
function showProfilePicker(){$('master').value='';$('masterConfirm').value='';vault=null;masterKey=null;encryptionSalt=null;token=null;googleEmail=null;tokenClient=null;pendingCloudAction=null;activeProfileId=null;stopAutoBackup();clearSensitiveUI();
 $('gate').classList.add('hidden');$('app').classList.add('hidden');$('profilePicker').classList.remove('hidden');$('lockBtn').classList.add('hidden');
 $('profileCreateForm').classList.add('hidden');$('profileCreateError').classList.add('hidden');$('profileList').innerHTML=profiles.length?profiles.map(p=>`<button class="profile-choice" data-profile="${esc(p.id)}"><span class="ricon">${iconMarkup(p.icon||'vault')}</span><span class="rinfo"><strong>${esc(p.name)}</strong><small>獨立主密碼 · 獨立加密資料</small></span><span class="chevron">${iconMarkup('arrow','sm')}</span></button>`).join(''):'<p class="hint">首次使用請建立您的私人保險箱。</p>';
 $('profileList').querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>chooseProfile(b.dataset.profile));refreshRecoveryUI();}
function chooseProfile(id){stopAutoBackup();if(!profiles.some(p=>p.id===id))return;activeProfileId=id;token=null;googleEmail=null;tokenClient=null;pendingCloudAction=null;
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
 const next=[...profiles,p];await safeWrite(PROFILES_KEY,JSON.stringify(next));profiles=next;
 $('newProfileName').value='';$('profileCreateForm').classList.add('hidden');chooseProfile(p.id);
 }catch(err){creationError(err.message||'建立使用者失敗，請檢查瀏覽器儲存權限')}};
$('switchFromGate').onclick=async()=>{if(await settleCurrentWrites())showProfilePicker()};
$('switchProfile').onclick=async()=>{if(!confirm('切換使用者前將鎖定目前保險箱，確定切換？'))return;if(!await settleCurrentWrites())return;for(const d of document.querySelectorAll('dialog[open]'))d.close();showProfilePicker()};
let vault=null, masterKey=null, encryptionSalt=null, selectedCat='all', selectedRecord=null, token=null, tokenClient=null, pendingCloudAction=null, lastActive=Date.now();let smallMode='member';
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
  await saveEnvelope(id,envelope);
  source.updatedAt=timestamp;setCloudPrefs({lastLocalChange:timestamp});queueAutoBackup();updateCloudStatus();
 });
 saveChains.set(id,task);
 try{await task}finally{if(saveChains.get(id)===task)saveChains.delete(id)}
}
function gateMode(){if(!activeProfileId)return showProfilePicker();$('gateError').classList.add('hidden');const exists=!!getEnvelope();$('gateTitle').textContent=exists?'解鎖私人保險箱':'建立私人保險箱';$('gateDesc').textContent=exists?'輸入此使用者的主密碼。':'請為這位使用者設定獨立的主密碼（至少 12 字元）。';$('confirmWrap').classList.toggle('hidden',exists);$('gateBtn').textContent=exists?'解鎖保險箱':'建立加密資料庫';$('app').classList.add('hidden');$('gate').classList.remove('hidden');$('lockBtn').classList.add('hidden');}
async function lock(){if(!await settleCurrentWrites())return;stopAutoBackup();clearSensitiveUI();vault=null;masterKey=null;encryptionSalt=null;selectedRecord=null;$('master').value='';$('masterConfirm').value='';for(const d of document.querySelectorAll('dialog[open]'))d.close();gateMode();notify('已安全鎖定');}
async function unlock(password){const obj=getEnvelope();const result=await dec(obj,password);vault=result.data;masterKey=result.key;encryptionSalt=result.salt;$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('app').classList.remove('recovery-mode');$('lockBtn').classList.remove('hidden');lastActive=Date.now();selectedCat='all';render();$('master').value='';$('masterConfirm').value='';refreshRecoveryUI();notify('已解鎖');}
$('gateBtn').onclick=async()=>{const p=$('master').value;$('gateError').classList.add('hidden');if(!p)return creationError('請輸入主密碼','gateError');$('gateBtn').disabled=true;try{checkLocalSecurity();$('gateBtn').textContent='正在加密處理…';if(getEnvelope()){await unlock(p)}else{if(p.length<12)throw Error('主密碼至少需要 12 字元');if(p!==$('masterConfirm').value)throw Error('兩次輸入的主密碼不一致');encryptionSalt=crypto.getRandomValues(new Uint8Array(16));masterKey=await deriveKey(p,encryptionSalt);vault=emptyVault();await persist();$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('lockBtn').classList.remove('hidden');render();$('master').value='';$('masterConfirm').value='';notify('加密保險箱建立成功')}}catch(e){creationError(String(e.message||'建立失敗').includes('decrypt')?'主密碼不正確':(e.message||'建立失敗'),'gateError')}finally{$('gateBtn').disabled=false;$('gateBtn').textContent=getEnvelope()?'解鎖保險箱':'建立加密資料庫'}};
$('lockBtn').onclick=lock;
['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{if(vault)lastActive=Date.now()},{passive:true}));setInterval(()=>{if(vault&&Date.now()-lastActive>300000)lock()},15000);
function mname(id){return vault.members.find(x=>x.id===id)?.name||'未分類'}function cname(id){return vault.categories.find(x=>x.id===id)?.name||'其他'}function cat(id){return vault.categories.find(x=>x.id===id)||DEFAULT_CATS[7]}
function tab(t){if(!vault&&t!=='settings')return;for(const name of ['records','members','due','settings'])$(name+'Page').classList.toggle('hidden',name!==t);document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));if(t==='due')renderDue();if(t==='members')renderMembers();window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>tab(b.dataset.go));
function render(){if(!vault)return;updateCloudStatus();$('activeProfileBadge').textContent=(selectedProfile()?.name||'');$('countAll').textContent=vault.records.length;$('countMember').textContent=vault.members.length;$('countDue').textContent=vault.records.filter(r=>r.due&&r.due<=today()).length;renderCats();renderRecords();renderMembers();renderDue();renderSelects();}
function renderCats(){const rows=[{id:'all',name:'全部分類',icon:'all',color:'#eaf0f6'},...vault.categories];$('categories').innerHTML=rows.map(c=>`<button class="category ${selectedCat===c.id?'selected':''}" data-cat="${esc(c.id)}"><span class="art" style="background:${/^#[0-9a-fA-F]{6}$/.test(c.color)?c.color:'#eaf0f6'}">${iconMarkup(c.icon,'lg',c.name)}</span><small>${esc(c.name)}</small><span class="num">${c.id==='all'?vault.records.length:vault.records.filter(r=>r.category===c.id).length} 筆</span></button>`).join('');$('categories').querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedCat=b.dataset.cat;renderCats();renderRecords()});}
function renderSelects(){const mf=$('memberFilter');const old=mf.value;mf.innerHTML='<option value="all">所有家人</option>'+vault.members.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');mf.value=[...mf.options].some(o=>o.value===old)?old:'all';$('rMember').innerHTML=vault.members.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');$('rCategory').innerHTML=vault.categories.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');}
function card(r){const c=cat(r.category);return `<button class="record" data-rec="${esc(r.id)}"><span class="ricon" style="background:${/^#[0-9a-fA-F]{6}$/.test(c.color)?c.color:'#eef4f8'}">${iconMarkup(c.icon,'md',c.name)}</span><span class="rinfo"><strong>${esc(r.title)}</strong><small>${esc(mname(r.member))} · ${esc(r.username||'未填帳號')}${r.due&&r.due<=today()?' · 待檢查':''}</small></span><span class="chevron">${iconMarkup('arrow','sm')}</span></button>`;}
function bindCards(el){el.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>showDetail(b.dataset.rec));}
function renderRecords(){if(!vault)return;const q=$('search').value.trim().toLowerCase(),member=$('memberFilter').value||'all';$('listTitle').textContent=selectedCat==='all'?'全部帳號':cname(selectedCat);const items=vault.records.filter(r=>(selectedCat==='all'||r.category===selectedCat)&&(member==='all'||r.member===member)&&[r.title,r.username,r.note].some(s=>String(s||'').toLowerCase().includes(q))).sort((a,b)=>a.title.localeCompare(b.title,'zh-Hant'));$('records').innerHTML=items.length?items.map(card).join(''):'<div class="empty">🌱 還沒有符合條件的帳號，點選「新增帳號」開始整理。</div>';bindCards($('records'));}
function renderMembers(){$('members').innerHTML=vault.members.map(m=>`<div class="member"><span class="ricon">${iconMarkup(m.icon||'person','md',m.name)}</span><span class="rinfo"><strong>${esc(m.name)}</strong><small>${vault.records.filter(r=>r.member===m.id).length} 筆帳號</small></span></div>`).join('');}
function renderDue(){const items=vault.records.filter(r=>r.due&&r.due<=today());$('dueList').innerHTML=items.length?items.map(card).join(''):'<div class="empty">🌷 目前沒有到期需要檢查的帳號。</div>';bindCards($('dueList'));}
$('search').oninput=renderRecords;$('memberFilter').onchange=renderRecords;
function openEdit(id=null){const r=id?vault.records.find(x=>x.id===id):null;$('editHeading').textContent=r?'編輯帳號':'新增帳號';$('editId').value=r?.id||'';$('rTitle').value=r?.title||'';$('rUser').value=r?.username||'';$('rPassword').value=r?.password||'';$('rPassword').type='password';$('rTransactionPassword').value=r?.transactionPassword||'';$('rTransactionPassword').type='password';$('rTransactionChanged').value=r?.transactionChanged||'';$('rUrl').value=r?.url||'';$('rChanged').value=r?.changed||today();$('rDue').value=r?.due||'';$('rNote').value=r?.note||'';$('rSecurityQuestion').value=r?.securityQuestion||'';$('rSecurityAnswer').value=r?.securityAnswer||'';$('rSecurityAnswer').type='password';$('rSecurityPin').value=r?.securityPin||'';$('rSecurityPin').type='password';$('rSecurityPinChanged').value=r?.securityPinChanged||'';$('rRecoveryContact').value=r?.recoveryContact||'';$('rRecoveryCodes').value=r?.recoveryCodes||'';$('rRecoveryCodes').classList.remove('recovery-visible');$('toggleRecoveryCodes').textContent='顯示';document.querySelectorAll('[data-toggle-secret]').forEach(b=>b.textContent='顯示');renderSelects();$('rMember').value=r?.member||'self';$('rCategory').value=r?.category||(selectedCat==='all'?'other':selectedCat);$('advancedSecurity').open=false;markEditPristine();$('editDialog').showModal();}
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
const r={id:id||uid(),title:$('rTitle').value.trim(),member:$('rMember').value,category:$('rCategory').value,username:$('rUser').value.trim(),password,transactionPassword,transactionChanged,transactionHistory,securityQuestion:$('rSecurityQuestion').value.trim(),securityAnswer:$('rSecurityAnswer').value,securityPin,securityPinChanged,securityPinHistory,recoveryContact:$('rRecoveryContact').value.trim(),recoveryCodes:$('rRecoveryCodes').value.trim(),url:$('rUrl').value.trim(),changed,due:$('rDue').value,note:$('rNote').value.trim(),history,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(!r.title)return notify('請填寫名稱');const before=old?structuredClone(old):null;if(old)Object.assign(old,r);else vault.records.push(r);try{await persist();$('editDialog').close();render();notify('已安全儲存於本機')}catch(ex){if(old)Object.assign(old,before);else vault.records=vault.records.filter(x=>x.id!==r.id);notify('儲存失敗：'+ex.message)}}
function secretText(secret){return secret?'••••••••':'未設定'}
function secretRow(secret,id){return `<div class="secret"><code id="${id}">${secretText(secret)}</code>${secret?`<button class="soft sm" data-show="${id}">顯示</button><button class="soft sm" data-copy="${id}">複製</button>`:''}</div>`;}
function recordSecretValue(r,id){if(id==='current')return r.password||'';if(id==='transactionCurrent')return r.transactionPassword||'';if(id==='securityAnswer')return r.securityAnswer||'';if(id==='securityPin')return r.securityPin||'';if(id==='recoveryCodes')return r.recoveryCodes||'';if(/^pinhist\d+$/.test(id))return r.securityPinHistory?.[Number(id.slice(7))]?.password||'';if(/^transhist\d+$/.test(id))return r.transactionHistory?.[Number(id.slice(9))]?.password||'';if(/^hist\d+$/.test(id))return r.history?.[Number(id.slice(4))]?.password||'';return '';}
function showDetail(id){const r=vault.records.find(x=>x.id===id);if(!r)return;selectedRecord=id;$('detailTitle').innerHTML=`<span class="titleicon">${iconMarkup(cat(r.category).icon,'md',cat(r.category).name)}</span><span>${esc(r.title)}</span>`;const url=/^https:\/\//i.test(r.url||'')?r.url:'';$('detailContent').innerHTML=`<div class="dfield"><div class="lab">所屬家人 / 分類</div><div class="val">${esc(mname(r.member))} · ${esc(cname(r.category))}</div></div><div class="dfield"><div class="lab">帳號 / Email</div><div class="val">${esc(r.username||'未設定')} ${r.username?'<button class="soft sm" data-copyuser>複製</button>':''}</div></div><div class="dfield"><div class="lab">目前密碼</div>${secretRow(r.password,'current')}</div><div class="dfield transaction-detail"><div class="lab">網路交易密碼</div>${secretRow(r.transactionPassword||'','transactionCurrent')}<div class="hint">交易密碼更換日期：${fmt(r.transactionChanged)}</div></div><div class="dfield"><div class="lab">最後更換日期</div><div class="val">${fmt(r.changed)}</div></div><div class="dfield"><div class="lab">下次檢查日期</div><div class="val">${fmt(r.due)}</div></div>${url?`<div class="dfield"><div class="lab">網站</div><a class="link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">開啟登入網站 ↗</a></div>`:''}${r.note?`<div class="dfield"><div class="lab">備註</div><div class="val">${esc(r.note)}</div></div>`:''}<div class="dfield"><h3>密碼歷史紀錄（${r.history?.length||0}）</h3>${(r.history||[]).map((h,i)=>`<div class="history"><small>第 ${r.history.length-i} 筆歷史 · 密碼日期 ${fmt(h.changed)}</small>${secretRow(h.password,'hist'+i)}</div>`).join('')||'<p class="hint">尚無舊密碼紀錄</p>'}</div><div class="dfield transaction-detail"><h3>交易密碼歷史紀錄（${r.transactionHistory?.length||0}）</h3>${(r.transactionHistory||[]).map((h,i)=>`<div class="history"><small>交易密碼歷史 · 更換日期 ${fmt(h.changed)}</small>${secretRow(h.password,'transhist'+i)}</div>`).join('')||'<p class="hint">尚無舊交易密碼紀錄</p>'}</div><div class="dfield advanced-detail"><h3>進階安全資訊</h3><div class="lab">安全問題</div><div class="val">${esc(r.securityQuestion||'未設定')}</div><div class="lab">安全問題答案</div>${secretRow(r.securityAnswer||'','securityAnswer')}<div class="lab">PIN 碼</div>${secretRow(r.securityPin||'','securityPin')}<p class="hint">PIN 更換日期：${fmt(r.securityPinChanged)}</p><div class="lab">備用驗證資訊</div><div class="val multiline">${esc(r.recoveryContact||'未設定')}</div><div class="lab">恢復代碼</div>${secretRow(r.recoveryCodes||'','recoveryCodes')}<p class="hint">已使用的恢復代碼請手動移除或更新。</p></div><div class="dfield"><h3>PIN 歷史紀錄（${r.securityPinHistory?.length||0}）</h3>${(r.securityPinHistory||[]).map((h,i)=>`<div class="history"><small>PIN 更換日期 ${fmt(h.changed)}</small>${secretRow(h.password,'pinhist'+i)}</div>`).join('')||'<p class="hint">尚無舊 PIN 紀錄</p>'}</div>`;
$('detailContent').querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const element=$(b.dataset.show);const secret=recordSecretValue(r,b.dataset.show);element.textContent=element.textContent===secret?'••••••••':secret;b.textContent=element.textContent===secret?'隱藏':'顯示'});
$('detailContent').querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const secret=recordSecretValue(r,b.dataset.copy);copySecret(secret)});
const copyuser=$('detailContent').querySelector('[data-copyuser]');if(copyuser)copyuser.onclick=()=>copySecret(r.username);$('detailDialog').showModal();}
async function copySecret(v){try{await navigator.clipboard.writeText(v||'');notify('已複製到剪貼簿；使用後請清除剪貼簿')}catch{notify('無法複製，請使用 HTTPS 網址開啟')}}
$('editRecord').onclick=()=>{$('detailDialog').close();openEdit(selectedRecord)};
$('deleteRecord').onclick=async()=>{if(!vault||!selectedRecord)return;if(!confirm('確定永久刪除這筆帳號及全部舊密碼歷史？'))return;const prior=vault.records;vault.records=vault.records.filter(x=>x.id!==selectedRecord);try{await persist();$('detailDialog').close();render();notify('帳號已刪除')}catch(e){vault.records=prior;notify('刪除失敗：'+e.message)}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function openSmall(mode){smallMode=mode;$('smallHeading').textContent=mode==='member'?'新增家庭成員':'自訂帳號分類';$('smallLabel').textContent=mode==='member'?'成員稱呼':'分類名稱';$('smallName').value='';$('smallEmoji').value='';$('smallDialog').showModal();}
$('addMember').onclick=()=>openSmall('member');$('addCategory').onclick=()=>openSmall('category');
$('smallForm').onsubmit=async e=>{e.preventDefault();const name=$('smallName').value.trim();if(!name)return;const icon=$('smallEmoji').value.trim()||(smallMode==='member'?'person':'other');const kind=smallMode==='member'?'members':'categories';const item=kind==='members'?{id:uid(),name,icon}:{id:uid(),name,icon,color:'#e7f0f4'};const btn=$('smallForm').querySelector('[type=submit]');btn.disabled=true;vault[kind].push(item);try{await persist();$('smallDialog').close();render();notify('已新增')}catch(err){vault[kind]=vault[kind].filter(x=>x.id!==item.id);notify('新增失敗，未保存變更：'+err.message)}finally{btn.disabled=false}};
function downloadFile(obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='拾光家庭密碼管家_加密備份_'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
$('exportBtn').onclick=async()=>{try{if(activeProfileId&&saveChains.get(activeProfileId))await saveChains.get(activeProfileId);const e=getEnvelope();if(!e)return notify('尚無資料');downloadFile(e);notify('已產生加密備份檔')}catch(err){notify('匯出失敗：'+err.message)}};
async function restoreObject(obj){if(!await settleCurrentWrites())throw Error('本機資料尚未儲存成功，已取消還原');if(!validateEnvelope(obj))throw Error('不是有效的拾光加密備份');const pass=prompt('請輸入「備份檔」原本的主密碼，用於驗證加密資料：');if(pass===null)return;const restoreProfile=activeProfileId;const parsed=await dec(obj,pass);if(restoreProfile!==activeProfileId)throw Error('還原期間使用者已切換');if(!confirm('備份解密成功。還原會覆蓋目前裝置的全部帳號與密碼歷史，且無法復原。確定繼續？'))return;const prior=getEnvelope()?JSON.stringify(getEnvelope()):null;if(prior&&prior!==JSON.stringify(obj)){const rollbackKey='shiguang-vault-restore-safety-'+activeProfileId+'-'+Date.now()+'-'+crypto.randomUUID();try{await safeWrite(rollbackKey,prior)}catch{throw Error('無法儲存還原前的安全副本，已取消還原。請先匯出本機加密備份，勿清除網站資料。')}}await saveEnvelope(restoreProfile,obj);vault=parsed.data;masterKey=parsed.key;encryptionSalt=parsed.salt;setCloudPrefs({lastLocalChange:new Date().toISOString()});stopAutoBackup();setCloudPrefs({autoPaused:true,lastError:''});updateCloudStatus('已還原資料；自動備份暫停，請先核對資料再手動備份');$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('lockBtn').classList.remove('hidden');$('app').classList.remove('recovery-mode');render();tab('records');notify('加密備份已成功還原');return true;}
for(const id of ['importFile','gateFile'])$(id).onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>12000000){notify('備份檔太大');return}try{await restoreObject(JSON.parse(await f.text()))}catch(err){notify('還原失敗：'+(err.name==='OperationError'?'主密碼不正確或備份已損壞':err.message))}finally{e.target.value=''}};
$('importBtn').onclick=()=>$('importFile').click();$('gateImport').onclick=()=>$('gateFile').click();
$('changeMaster').onclick=async()=>{if(saveChains.get(activeProfileId))await saveChains.get(activeProfileId);const p=prompt('輸入新的主密碼（至少 12 字元）');if(p===null)return;if(p.length<12)return notify('至少 12 字元');const p2=prompt('再次輸入新的主密碼');if(p!==p2)return notify('兩次輸入不一致');if(!confirm('更換主密碼後，舊雲端備份仍使用舊密碼。請立即重新上傳最新備份。確定更換？'))return;const newSalt=crypto.getRandomValues(new Uint8Array(16)),newKey=await deriveKey(p,newSalt);const oldKey=masterKey,oldSalt=encryptionSalt;encryptionSalt=newSalt;masterKey=newKey;try{await persist();notify('主密碼已變更；請立即重新備份')}catch(e){masterKey=oldKey;encryptionSalt=oldSalt;notify('主密碼更換失敗：'+e.message)}};
// Google OAuth: access token is held in memory, never saved locally.
const DRIVE_NAME='shiguang-personal-vault.enc.json';
const SNAPSHOT_PREFIX='shiguang-personal-vault-backup-';
const BACKUP_LIMIT=30; // list up to 30 recent snapshots; never automatically delete backups
try{$('clientId').value=localStorage.getItem('shiguang-google-client-id')||''}catch{$('clientId').value=''};
$('saveClient').onclick=()=>{const v=$('clientId').value.trim();if(v&&!v.endsWith('.apps.googleusercontent.com'))return notify('OAuth 用戶端 ID 格式有誤');try{localStorage.setItem('shiguang-google-client-id',v);token=null;tokenClient=null;notify('已儲存設定（不是 Google 密鑰）')}catch{notify('瀏覽器 localStorage 空間已滿，OAuth 設定未儲存；請保留原有資料並檢查儲存空間')}};
function loadGIS(){return new Promise((resolve,reject)=>{if(window.google?.accounts?.oauth2)return resolve();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=resolve;s.onerror=()=>reject(Error('無法載入 Google 登入程式，請檢查網路'));document.head.append(s)})}
async function authorize(next){
 if(!activeProfileId)throw Error('請先選擇使用者');
 if(!window.isSecureContext||location.protocol==='file:')throw Error('Google 連線需部署至 HTTPS（例如 GitHub Pages）');
 const clientId=$('clientId').value.trim();if(!clientId)throw Error('請先填寫 Google OAuth 用戶端 ID');
 await loadGIS();pendingCloudAction=next;const authorizingProfile=activeProfileId;
 if(!tokenClient){tokenClient=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'openid email https://www.googleapis.com/auth/drive.appdata',callback:async resp=>{
  if(authorizingProfile!==activeProfileId){pendingCloudAction=null;token=null;return}
  if(resp.error){notify('Google 授權失敗：'+resp.error);pendingCloudAction=null;return}
  token=resp.access_token;
  try{await verifyGoogleIdentity();$('cloudState').textContent='✅ 已連線：'+googleEmail+'（'+selectedProfile().name+'）';refreshRecoveryUI();
   const action=pendingCloudAction;pendingCloudAction=null;if(action)await action();else await refreshCloudBackups();
  }catch(err){token=null;googleEmail=null;pendingCloudAction=null;notify('Google 連線中止：'+err.message)}
 }})}
 tokenClient.requestAccessToken({prompt:'select_account consent'});
}
async function verifyGoogleIdentity(){
 const response=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token}});
 if(!response.ok)throw Error('無法確認 Google 帳號身分');
 const who=await response.json();const email=String(who.email||'').toLowerCase();
 if(!email||who.email_verified!==true)throw Error('Google 帳號信箱尚未驗證');
 const current=selectedProfile();if(!current)throw Error('未選擇使用者');
 if(current.googleEmail&&current.googleEmail!==email)throw Error('這個保險箱已綁定 '+current.googleEmail+'，不能使用 '+email+' 的雲端資料');
 if(profiles.some(p=>p.id!==current.id&&p.googleEmail===email))throw Error('這個 Google 帳號已綁定其他本機保險箱，請改用家人自己的 Google 帳號');
 if(!current.googleEmail){if(!confirm('即將把「'+current.name+'」的雲端備份綁定至 '+email+'。此保險箱之後只能連接這個 Google 帳號。確定嗎？'))throw Error('已取消綁定');current.googleEmail=email;await saveProfiles()}
 googleEmail=email;updateCloudStatus();
}
async function assertCloudIdentity(){
 const id=activeProfileId, profile=selectedProfile();
 if(!id||!profile||!token||!googleEmail||profile.googleEmail!==googleEmail)throw Error('請重新連接正確的 Google 帳號');
 const response=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token}});
 if(!response.ok)throw Error('無法再次驗證 Google 身分，請重新授權');
 const info=await response.json();
 if(id!==activeProfileId||!info.email_verified||String(info.email||'').toLowerCase()!==googleEmail){token=null;googleEmail=null;throw Error('Google 帳號與目前保險箱不一致，已停止雲端操作')}
 return id;
}
async function sha256Text(text){const bytes=new TextEncoder().encode(text);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function withGoogle(fn){if(token&&googleEmail===selectedProfile()?.googleEmail){await assertCloudIdentity();return fn()}token=null;return authorize(fn)}
$('connectGoogle').onclick=()=>authorize(null).catch(e=>notify(e.message));
$('autoBackup').onchange=e=>{setCloudPrefs({auto:!!e.target.checked,autoPaused:false});updateCloudStatus();if(e.target.checked){notify('已啟用：資料修改後，Google 連線有效時自動備份；請先連線 Google');if(vault)queueAutoBackup()}else{stopAutoBackup();notify('已停用自動備份')}};
async function driveFetch(url,opts={}){const response=await fetch(url,{...opts,headers:{Authorization:'Bearer '+token,...opts.headers}});if(response.status===401){token=null;$('cloudState').textContent='連線逾時，請重新授權';throw Error('Google 授權過期，請重新連線')}if(!response.ok)throw Error('Google API '+response.status+': '+(await response.text()).slice(0,150));return response}
async function listCloud(){
 await assertCloudIdentity();
 const all=[];let pageToken='';
 do{
  const q="(name = '"+DRIVE_NAME+"' or name = 'shiguang-family-vault.enc.json' or name contains '"+SNAPSHOT_PREFIX+"') and trashed = false";
  const params={spaces:'appDataFolder',q,fields:'nextPageToken,files(id,name,modifiedTime,size)',pageSize:'100',orderBy:'modifiedTime desc'};
  if(pageToken)params.pageToken=pageToken;
  const response=await (await retryCloudRead(()=>driveFetch('https://www.googleapis.com/drive/v3/files?'+new URLSearchParams(params)))).json();
  all.push(...(response.files||[]));pageToken=response.nextPageToken||'';
 }while(pageToken&&all.length<500);
 return all.filter(f=>f.name===DRIVE_NAME||f.name==='shiguang-family-vault.enc.json'||(f.name.startsWith(SNAPSHOT_PREFIX)&&f.name.endsWith('.enc.json'))).sort((a,b)=>(b.modifiedTime||'').localeCompare(a.modifiedTime||''));
}
function backupDate(file){return file.modifiedTime?new Date(file.modifiedTime).toLocaleString('zh-TW',{hour12:false}):'不明時間'}
function renderCloudList(files){
 const el=$('cloudBackupList');if(!el)return;
 if(!files.length){el.innerHTML='<p class="hint">目前雲端沒有加密備份。</p>';return}
 el.innerHTML='<p class="hint">找到 '+files.length+' 份備份（最多顯示最近 '+BACKUP_LIMIT+' 份）。選擇其中一份還原：</p>'+files.slice(0,BACKUP_LIMIT).map((f,i)=>`<button class="profile-choice backup-choice" data-cloud-index="${i}"><span class="ricon">${iconMarkup('cloud','md','雲端備份')}</span><span class="rinfo"><strong>${esc(backupDate(f))}${i===0?' · 最新':''}</strong><small>${esc(f.name.startsWith(SNAPSHOT_PREFIX)?'獨立版本備份':'舊版備份')} · ${f.size?Math.ceil(Number(f.size)/1024)+' KB':'加密檔'}</small></span><span class="chevron">還原 ${iconMarkup('arrow','sm')}</span></button>`).join('');
 el.querySelectorAll('[data-cloud-index]').forEach(btn=>btn.onclick=()=>runCloudUi('正在讀取所選加密版本…',()=>restoreCloudFile(files[Number(btn.dataset.cloudIndex)])));
}
async function createCloudBackup(encrypted){
 const boundary='shiguang_'+uid().replaceAll('-','');
 const now=new Date().toISOString().replace(/[:.]/g,'-');
 const name=SNAPSHOT_PREFIX+now+'-'+uid().slice(0,8)+'.enc.json';
 const meta={name,parents:['appDataFolder'],mimeType:'application/json',description:'Encrypted Shiguang personal vault snapshot'};
 const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+encrypted+'\r\n--'+boundary+'--';
 const response=await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});return response.json();
}
async function readCloudEnvelope(file){
 if(!file?.id)throw Error('雲端備份缺少檔案 ID');
 const response=await retryCloudRead(()=>driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media'));
 const raw=await response.text();
 if(raw.length>15000000)throw Error('雲端備份太大，拒絕讀取');
 let item;try{item=JSON.parse(raw)}catch{throw Error('雲端備份不是有效 JSON')}
 if(!validateEnvelope(item))throw Error('雲端備份格式不正確');
 return {item,raw};
}
async function verifyUploadedSnapshot(file,expectedEncrypted){
 const loaded=await readCloudEnvelope(file);
 // Stringify the parsed object; ignore whitespace-only differences.
 const expected=JSON.parse(expectedEncrypted);
 if(await sha256Text(JSON.stringify(loaded.item))!==await sha256Text(JSON.stringify(expected)))throw Error('雲端備份上傳後讀回比對失敗，不能標示備份成功');
 return true;
}
async function uploadCloud(automatic=false){
 if(!vault)throw Error('請先解鎖才能上傳');
 if(cloudBusy)throw Error('另一項雲端備份正在進行');
 if(!await settleCurrentWrites())throw Error('本機加密儲存未完成，已取消雲端上傳');
 await assertCloudIdentity();
 cloudBusy=true;
 try{
  const dataId=activeProfileId;const prefs=cloudPrefs();const localEnvelope=getEnvelope();if(!localEnvelope)throw Error('本機尚未建立資料');const encryptedAtStart=JSON.stringify(localEnvelope);
  const files=await listCloud();if(dataId!==activeProfileId)throw Error('備份期間使用者已切換');const latest=files[0];
  // Compare remote snapshot against last acknowledged cloud checkpoint, not just the local clock.
  // A fresh installation with unknown remote state needs a manual decision.
  const lastSeen=prefs.lastSeenCloudTime||'';
  const remoteChanged=!!latest&&(!prefs.lastSeenCloudId||prefs.lastSeenCloudId!==latest.id);
  // Never infer equality from a device clock; the most recent Drive file ID is the checkpoint.
  if(remoteChanged){
   updateCloudStatus('⚠️ 雲端有尚未核對的版本：'+backupDate(latest));
   if(automatic){setCloudPrefs({autoPaused:true});throw Error('偵測到未核對的雲端備份，已暫停自動備份；請先列出歷史版本')} 
   if(!confirm('⚠️ 雲端有尚未核對的版本（'+backupDate(latest)+'）。可能是其他裝置新增。\n\n建議先匯出本機加密備份，再查看歷史版本。\n這次上傳會新增獨立快照，不會覆蓋舊版。仍要上傳？'))return;
  }else if(!automatic&&latest&&!confirm('即將新增一份加密備份（不覆蓋舊版），確定繼續？'))return;
  // Recheck after listing to avoid treating a stale local snapshot as current.
  if(JSON.stringify(getEnvelope())!==encryptedAtStart)throw Error('備份期間本機資料已修改，請重新上傳');
  // Check the remote checkpoint again directly before writing. This is a guard,
  // not a transactional lock: another device can still upload at the same moment.
  const preflight=await listCloud();
  if((preflight[0]?.id||'')!==(latest?.id||'')){
   setCloudPrefs({autoPaused:true});
   throw Error('上傳前雲端版本發生改變，已取消本次上傳；請先檢查其他裝置的備份');
  }
  if(JSON.stringify(getEnvelope())!==encryptedAtStart)throw Error('上傳前本機資料已變動，請重新備份');
  const uploaded=await createCloudBackup(encryptedAtStart);
  if(!uploaded?.id)throw Error('Google Drive 未回傳備份 ID，無法確認上傳完成');
  await verifyUploadedSnapshot(uploaded,encryptedAtStart);
  if(dataId!==activeProfileId)throw Error('使用者已切換，請重新確認備份');
  const stamped=uploaded.modifiedTime||new Date().toISOString();
  const unchanged=JSON.stringify(getEnvelope())===encryptedAtStart;setCloudPrefs({lastBackup:unchanged?new Date().toISOString():prefs.lastBackup,lastSeenCloudTime:stamped,lastSeenCloudId:uploaded.id||'',autoPaused:false,lastError:''});
  if(!unchanged){updateCloudStatus('⚠️ 雲端已有備份，但備份途中本機又有修改；請再次備份');return}
  updateCloudStatus('✅ 已成功備份 '+new Date().toLocaleString('zh-TW',{hour12:false})+' · 歷史版本保留');
  notify(automatic?'已自動上傳加密備份':'已新增加密雲端備份');
  await refreshCloudBackups();
 }finally{cloudBusy=false}
}
async function refreshCloudBackups(){
 const files=await listCloud();renderCloudList(files);const current=files[0];const prefs=cloudPrefs();if(current&&prefs.lastSeenCloudId&&current.id!==prefs.lastSeenCloudId){updateCloudStatus('⚠️ 雲端版本比上次確認更新，可能來自其他裝置；請核對後再上傳')}else updateCloudStatus();
 $('cloudCount').textContent='目前找到 '+files.length+' 份加密備份';
 return files;
}
async function restoreCloudFile(file){
 if(!file)throw Error('請先選擇備份');
 await assertCloudIdentity();
 if(vault&&!confirm('即將從 '+backupDate(file)+' 的雲端版本還原。還原可能覆蓋這部裝置較新的修改。\n建議先點「匯出加密備份檔」保存本機版本。要繼續嗎？'))return;
 const {item}=await readCloudEnvelope(file);
 const restored=await restoreObject(item);if(restored){setCloudPrefs({lastSeenCloudTime:file.modifiedTime||'',lastSeenCloudId:file.id||'',autoPaused:true,lastError:''});updateCloudStatus('✅ 已從 '+backupDate(file)+' 還原；之後的修改可以建立新的備份');}
}
async function downloadCloud(){const files=await refreshCloudBackups();if(!files.length)throw Error('此 Google 帳號尚無備份');await restoreCloudFile(files[0]);}
async function runCloudDiagnostic(){
 const button=$('testCloudConnection'), target=$('cloudTestResult');
 if(button)button.disabled=true;
 if(target)target.textContent='正在檢查 Google 身分及加密備份清單…';
 try{
  await assertCloudIdentity();
  const files=await listCloud();
  const latest=files[0];
  const messages=['Google 帳號驗證：成功（'+googleEmail+'）','加密備份數量：'+files.length];
  if(latest){
   const {item,raw}=await readCloudEnvelope(latest);
   messages.push('最新備份：'+backupDate(latest));
   messages.push('最新備份格式：有效（已能從雲端讀回）');
   const local=getEnvelope();
   if(local){const match=await sha256Text(JSON.stringify(item))===await sha256Text(JSON.stringify(local));messages.push('與本機加密檔是否相同：'+(match?'是':'否（可能是不同備份版本）'))}
   messages.push('雲端檔案大小：約 '+Math.ceil(new TextEncoder().encode(raw).length/1024)+' KB');
  }else messages.push('目前尚無雲端備份，未進行讀回驗證');
  messages.push('本項檢查不會顯示、解密或修改任何密碼。');
  target.textContent=messages.join('\n');
 }catch(e){if(target)target.textContent='雲端診斷未通過：'+e.message;throw e}
 finally{if(button)button.disabled=false}
}
$('testCloudConnection').onclick=()=>runCloudUi('正在檢查 Google 雲端連線…',()=>withGoogle(runCloudDiagnostic));
$('refreshCloud').onclick=()=>runCloudUi('正在讀取雲端歷史備份…',()=>withGoogle(refreshCloudBackups));
$('retryBackup').onclick=()=>runCloudUi('正在重新上傳加密備份…',()=>withGoogle(()=>uploadCloud(false))); 
$('showRecovery').onclick=()=>{$('recoveryGuide').classList.toggle('hidden');if(!$('recoveryGuide').classList.contains('hidden'))$('recoveryGuide').scrollIntoView({behavior:'smooth',block:'nearest'})};
$('uploadCloud').onclick=()=>runCloudUi('正在加密上傳並讀回驗證…',()=>withGoogle(()=>uploadCloud(false)));$('downloadCloud').onclick=()=>runCloudUi('正在讀取加密備份並準備還原…',()=>withGoogle(downloadCloud));$('gateCloud').onclick=()=>{clearSensitiveUI();tab('settings');$('app').classList.add('recovery-mode');$('recoveryGuide').classList.remove('hidden');$('gate').classList.add('hidden');$('app').classList.remove('hidden');$('settingsPage').classList.remove('hidden');document.querySelectorAll('.page').forEach(x=>{if(x.id!=='settingsPage')x.classList.add('hidden')});$('cloudState').textContent='請先確認目前選擇的使用者。設定 Google 用戶端 ID 後按「下載雲端備份並還原」；未建立本機保險箱也能還原。';};

async function inspectStorage(){
 const rows=[];let dbOk=false;
 try{const db=await openVaultDB();dbOk=!!db;rows.push('IndexedDB：可開啟')}catch(e){rows.push('IndexedDB：無法開啟（'+e.message+'）')}
 try{if(navigator.storage?.estimate){const x=await navigator.storage.estimate();rows.push('網站儲存估計：'+Math.round((x.usage||0)/1024)+' KB / 約 '+Math.round((x.quota||0)/1024/1024)+' MB')}else rows.push('此瀏覽器不提供容量估計')}catch(e){rows.push('無法查詢容量：'+e.message)}
 rows.push('目前使用者：'+(activeProfileId?'已選擇':'尚未選擇'));
 rows.push('加密保險箱：'+(getEnvelope()?'存在':'本機尚無資料'));
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


let cloudUiInProgress=false;
async function runCloudUi(message,action){
 if(cloudUiInProgress){notify('雲端操作正在進行，請稍後');return}
 cloudUiInProgress=true;setCloudAction(message,'working');
 const buttons=['uploadCloud','downloadCloud','refreshCloud','retryBackup','testCloudConnection'];
 for(const id of buttons)if($(id))$(id).disabled=true;
 try{const result=await action();setCloudAction('雲端操作已結束；請依上方備份狀態確認結果。','ok');return result}
 catch(e){setCloudAction('操作未完成：'+String(e?.message||e).slice(0,150),'failed');notify('雲端操作未完成：'+e.message);return null}
 finally{cloudUiInProgress=false;for(const id of buttons)if($(id))$(id).disabled=false;updateCloudStatus()}
}

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
 location.reload();
};
function setCloudAction(message,kind=''){
 const el=$('cloudActionState');if(!el)return;
 el.textContent=message;el.className='cloud-action-state'+(kind?' '+kind:'');
}
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

initProfiles().catch(e=>creationError('讀取本機使用者失敗：'+e.message));
