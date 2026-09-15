const WEEKDAYS = ['일','월','화','수','목','금','토'];

const LOGIC_QUOTES = [
  { text:'나는 생각한다, 그러므로 나는 존재한다.', author:'데카르트' },
  { text:'나는 내가 아무것도 모른다는 것을 안다.', author:'소크라테스' },
  { text:'아는 것이 힘이다.', author:'프랜시스 베이컨' },
  { text:'내용 없는 사고는 공허하고, 개념 없는 직관은 맹목적이다.', author:'칸트, 《순수이성비판》' },
  { text:'말할 수 없는 것에 대해서는 침묵해야 한다.', author:'비트겐슈타인, 《논리철학논고》' },
  { text:'두 모순되는 명제는 동시에 참일 수 없다.', author:'아리스토텔레스 — 모순율' },
  { text:'반증될 수 없는 이론은 과학이 아니다.', author:'칼 포퍼 — 반증가능성' },
  { text:'다른 의견을 억누르는 것은 인류 전체의 자산을 빼앗는 것과 같다.', author:'존 스튜어트 밀, 《자유론》' },
  { text:'특별한 주장에는 그만큼 특별한 증거가 필요하다.', author:'칼 세이건' },
  { text:'전제가 참이어도 추론이 잘못되면 결론은 거짓일 수 있다.', author:'논리학의 타당성 원칙' },
  { text:'명확한 정의 없이는 어떤 논쟁도 끝나지 않는다.', author:'소크라테스적 문답법' },
  { text:'권위에 기대는 논증은 그 권위가 틀렸을 가능성 앞에서 무너진다.', author:'논리적 오류 — 권위에 호소하기' },
];

function pickDailyQuote(dateStr){
  let seed = 0;
  for(let i=0;i<dateStr.length;i++) seed = (seed*31 + dateStr.charCodeAt(i)) >>> 0;
  return LOGIC_QUOTES[seed % LOGIC_QUOTES.length];
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function friendlyDate(d){
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}
function localDateStrKST(){
  const now = new Date();
  const kst = new Date(now.getTime() + 9*60*60*1000);
  return kst.toISOString().slice(0,10);
}
function extractTargetLength(q){
  const m = String(q||'').match(/(\d{2,4})\s*자/);
  return m ? parseInt(m[1],10) : 250;
}
function computeDdayLabel(targetDateStr){
  const target = new Date(targetDateStr+'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffDays = Math.round((target - today)/86400000);
  if(diffDays > 0) return `D-${diffDays}`;
  if(diffDays === 0) return 'D-DAY';
  return `D+${Math.abs(diffDays)}`;
}
function personIconSvg(){
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
}

// ---------------- Supabase REST 래퍼 ----------------
const SB_URL = window.ONNON_CONFIG.SUPABASE_URL.replace(/\/$/, '');
const SB_ANON = window.ONNON_CONFIG.SUPABASE_ANON_KEY;
const SESSION_KEY = 'onnon_session';

function saveSession(session){
  const expires_at = Date.now() + (session.expires_in || 3600) * 1000;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, expires_at }));
}
function getRawSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(e){ return null; }
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

async function refreshSessionIfNeeded(){
  const s = getRawSession();
  if(!s) return null;
  if(Date.now() < s.expires_at - 60000) return s;
  try{
    const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
      method:'POST',
      headers:{ apikey: SB_ANON, 'Content-Type':'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if(!res.ok){ clearSession(); return null; }
    const data = await res.json();
    saveSession(data);
    return getRawSession();
  }catch(e){ clearSession(); return null; }
}

// 로그인이 안 되어 있으면 login.html로 보냄. 되어 있으면 세션을 반환.
async function requireAuth(){
  const s = await refreshSessionIfNeeded();
  if(!s || !s.access_token){
    location.href = 'login.html';
    return null;
  }
  return s;
}

async function signUp(email, password){
  const res = await fetch(`${SB_URL}/auth/v1/signup`, {
    method:'POST',
    headers:{ apikey: SB_ANON, 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.msg || data.error_description || data.error || '회원가입에 실패했어요.');
  if(data.access_token){ saveSession(data); }
  return data;
}

async function signIn(email, password){
  const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method:'POST',
    headers:{ apikey: SB_ANON, 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.msg || data.error_description || data.error || '로그인에 실패했어요.');
  saveSession(data);
  return data;
}

function signOut(){
  clearSession();
  location.href = 'login.html';
}

// PostgREST 테이블 조회/삽입/수정 (항상 로그인한 사용자의 access_token으로 호출 → RLS 적용됨)
async function sbSelect(table, query, accessToken){
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    headers:{ apikey: SB_ANON, Authorization:`Bearer ${accessToken}` }
  });
  if(!res.ok) throw new Error(`${table} 조회 실패 (${res.status})`);
  return res.json();
}
async function sbUpsertOwn(table, row, accessToken){
  const res = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=id`, {
    method:'POST',
    headers:{
      apikey: SB_ANON, Authorization:`Bearer ${accessToken}`,
      'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(row)
  });
  if(!res.ok){ const t = await res.text(); throw new Error(`${table} 저장 실패: ${t}`); }
  const data = await res.json();
  return data[0];
}
