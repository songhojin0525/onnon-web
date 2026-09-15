function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 설정되어 있지 않습니다.`);
  return v;
}

function restUrl(path) {
  const base = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  return `${base}/rest/v1/${path}`;
}

function authUrl(path) {
  const base = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  return `${base}/auth/v1/${path}`;
}

// 오늘의 문제 3개를 problems 테이블에 저장(이미 있으면 덮어씀)
async function upsertProblems(dateStr, problems) {
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const rows = problems.map(p => ({
    problem_date: dateStr,
    skill_id: p.skill.id,
    skill_label: p.skill.label,
    skill_desc: p.skill.desc,
    skill_time: p.skill.time,
    topic: p.topic,
    passages: p.passages,
    chart: p.chart || null,
    question: p.question,
  }));

  const res = await fetch(restUrl('problems?on_conflict=problem_date,skill_id'), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`문제 저장 실패 (${res.status}): ${t.slice(0, 300)}`);
  }
  return res.json();
}

// access_token으로 로그인한 사용자 정보 확인 (위조된 요청 방지)
async function getUserFromToken(accessToken) {
  if (!accessToken) return null;
  const anonOrServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(authUrl('user'), {
    headers: {
      apikey: anonOrServiceKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// 채점 결과를 submissions 테이블에 저장
async function insertSubmission(row) {
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(restUrl('submissions'), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`기록 저장 실패 (${res.status}): ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data[0];
}

module.exports = { upsertProblems, getUserFromToken, insertSubmission };
