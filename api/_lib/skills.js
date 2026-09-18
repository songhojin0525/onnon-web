// 매일 로테이션되는 짧은 유형 목록 (2문제는 여기서 순서대로 고름)
const SKILL_ELEMENTS = [
  { id: 'compare',   label: '제시문 비교',      desc: '두 제시문에서 공통된 전제와 결정적으로 갈리는 지점을 정확히 구분해 내는 능력', time: 6 },
  { id: 'chart',     label: '도표 해석',        desc: '표나 그래프의 수치를 왜곡 없이 읽고 그 수치가 뒷받침하는 논지를 정확히 도출하는 능력', time: 5 },
  { id: 'define',    label: '개념 정의',        desc: '제시문에 등장한 핵심 개념을 글의 맥락에 맞게 정확히 정의하는 능력', time: 5 },
  { id: 'premise',   label: '숨은 전제 찾기',   desc: '주장이 성립하기 위해 반드시 필요한, 글에 명시되지 않은 전제를 정확히 짚어내는 능력', time: 7 },
  { id: 'rebuttal',  label: '반론 재반박',      desc: '예상되는 반론을 정확히 구성하고 그 반론의 허점을 논리적으로 재반박하는 능력', time: 8 },
  { id: 'analogy',   label: '유추의 한계 판단', desc: '제시문에 쓰인 비유나 유추가 성립하는 지점과 무너지는 지점을 정확히 구분하는 능력', time: 7 },
  { id: 'apply',     label: '입장 적용하기',    desc: '제시문의 입장을 새로운 사례에 적용했을 때 도출되는 결론을 정확히 이끌어내는 능력', time: 6 },
  { id: 'logic_gap', label: '논리적 비약 찾기', desc: '주장과 근거 사이에 있는 논리적 비약이나 근거 부족을 정확히 짚어내는 능력', time: 6 },
];

// 매일 3문제 중 1개로 고정 출제되는 장문 독해형
const LONG_READING_SKILL = {
  id: 'long_reading',
  label: '장문 독해',
  desc: '긴 지문의 핵심 주장·쟁점을 정확히 파악하고, <보기> 자료를 활용해 지문을 해석·적용하는 능력',
  time: 15,
};

function dayOfYear(d) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  return Math.floor((d - start) / 86400000);
}

// 한국 시간(KST, UTC+9) 기준 오늘 날짜 문자열 "YYYY-MM-DD"
function todayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 날짜 문자열 기준으로 오늘의 스킬 3개를 결정
// - 2개는 SKILL_ELEMENTS에서 매일 로테이션
// - 1개는 항상 장문 독해형(LONG_READING_SKILL) 고정 출제
function pickTodaySkills(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const startIdx = dayOfYear(d) % SKILL_ELEMENTS.length;
  const rotating = [0, 1].map(o => SKILL_ELEMENTS[(startIdx + o) % SKILL_ELEMENTS.length]);
  return [...rotating, LONG_READING_SKILL];
}

module.exports = { SKILL_ELEMENTS, LONG_READING_SKILL, todayKST, pickTodaySkills };
