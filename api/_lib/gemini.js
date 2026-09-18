// Anthropic Claude API — 문제 생성: Opus 5 / 채점: Sonnet 5
const MODEL_GENERATE = 'claude-opus-5';
const MODEL_GRADE = 'claude-sonnet-5';

async function callGemini({ system, user, maxTokens, model }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.');

  const body = {
    model: model || MODEL_GRADE,
    max_tokens: maxTokens || 2000,
    thinking: { type: 'disabled' },
    system: system + '\n\n반드시 JSON 객체 하나만 출력하세요. 설명, 마크다운 코드블록(```), 그 외 텍스트를 절대 포함하지 마세요. 응답은 { 로 시작해서 } 로 끝나야 합니다. 문자열 안에 인용부호가 필요하면 큰따옴표(") 대신 「 」 또는 작은따옴표(\')를 사용하세요. 숫자를 쓸 때 천단위 구분 콤마(예: 1,234)를 절대 사용하지 말고 순수 숫자(예: 1234)만 쓰세요. 배열이나 객체의 마지막 요소 뒤에 불필요한 콤마를 넣지 마세요.',
    messages: [
      { role: 'user', content: user },
    ],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Claude API 오류 (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const blocks = data.content || [];
  const textBlock = blocks.find(b => b.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new Error('Claude API가 빈 응답을 반환했어요. 상세: ' + JSON.stringify(data).slice(0, 500));
  }
  if (data.stop_reason === 'max_tokens') {
    throw new Error('AI 응답이 max_tokens 제한으로 중간에 잘렸습니다. maxTokens를 늘려야 합니다.');
  }

  return textBlock.text;
}

function parseJsonLoose(text) {
  let cleaned = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  function tryParse(s) {
    try { return { ok: true, value: JSON.parse(s) }; }
    catch (e) { return { ok: false, err: e }; }
  }

  let result = tryParse(cleaned);
  if (result.ok) return result.value;

  let repaired = cleaned
    .replace(/[\u201C\u201D]/g, "'")
    .replace(/[\u2018\u2019]/g, "'");
  result = tryParse(repaired);
  if (result.ok) return result.value;

  repaired = repaired.replace(/(\d),(\d{3})/g, '$1$2');
  result = tryParse(repaired);
  if (result.ok) return result.value;

  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  result = tryParse(repaired);
  if (result.ok) return result.value;

  const around = cleaned.slice(0, 600);
  throw new Error('AI 응답이 올바른 JSON 형식이 아닙니다: ' + result.err.message + ' / 원문 일부: ' + around);
}

async function generateOneProblem(skill, dateStr) {
  const system = '당신은 성균관대학교·고려대학교 인문계열 논술 출제위원입니다. 실제 대학 정시/수시 논술고사 수준의 변별력 있는 문제를 출제합니다. 두 학교의 실제 기출 논술문제 형식(고등학교 교육과정 과목과 자연스럽게 연계되는 소재, 설명문뿐 아니라 시·소설 등 문학 제시문도 활용하는 구성, 두 입장을 대비시키는 압축적인 문항 형태)을 참고해, 특정 대학의 실제 지문이나 문항 문장을 베끼지 않고 완전히 새로운 문제를 창작합니다. 응답은 오직 하나의 JSON 객체여야 하며, 그 외의 설명이나 마크다운 코드블록 표시는 절대 포함하지 마세요. 제시문이나 문항 안에서 인용부호가 필요하면 큰따옴표(") 대신 「 」 나 작은따옴표(\')를 사용하세요. 숫자는 천단위 콤마 없이 순수 숫자로만 쓰세요.';
  const user = `아래 능력 딱 하나만을 정확히 평가하는 압축형 논술 문제 1개를 만들어 주세요.

평가 능력: ${skill.desc}

조건:
- 난이도는 실제 대학 논술고사 수준으로, 단순 요약이 아니라 개념 간 관계를 스스로 재구성해야 풀리도록 설계하세요. 지나치게 뻔한 이분법 구도는 피하고, 두 제시문 사이에 미묘한 긴장이나 전제 차이가 있게 하세요.
- 제시문은 2개(가, 나)로 구성하고, 하나는 쟁점에 대한 옹호·지지 관점, 다른 하나는 비판·우려 관점을 담으세요. 각 제시문은 2~3문장, 90자 이내로 압축하세요.
- 제시문 소재는 고등학교 교육과정 과목(문학, 국어, 통합사회, 생활과 윤리, 윤리와 사상, 사회·문화, 경제, 세계사, 세계지리, 통합과학 등) 중 하나와 자연스럽게 연결되게 구성하세요. 대부분은 설명문·논설문 형식으로 쓰되, 가끔은 시나 소설의 한 장면처럼 문학적 정서가 담긴 제시문(이때도 창작)을 섞어 다양성을 주세요.
- question은 위 능력 하나만 요구하도록 설계하고, 문항 끝에 목표 분량을 "OOO자(±50자) 내외로 서술하시오" 형태로 명시하세요(150~250자 사이).
- ${skill.id === 'chart' ? `chart 필드를 반드시 포함하세요. 다음을 엄격히 지키세요:
  1) categories 배열 길이와 series[].values 배열 길이가 정확히 일치해야 합니다.
  2) 수치는 5~6개, 서로 다른 값으로 하고 극단적으로 비현실적인 수치(예: 음수 인구, 100%를 넘는 비율)는 넣지 마세요.
  3) 숫자는 반드시 천단위 콤마 없이 순수 숫자(예: 1234)로만 쓰세요.
  4) unit은 반드시 표기하고, title은 수치 내용과 정확히 일치해야 합니다.
  5) 만든 뒤 categories, series 길이와 unit 표기를 스스로 다시 확인하고 최종 출력하세요.` : '문제 성격상 자연스러우면 chart를 포함하고, 아니면 null로 두세요.'}
- 정의, 세대, 기술, 공동체, 시장, 환경, 언어, 공정성 등 실제 사회 이슈 중 하나를 소재로 삼되 진부하지 않게 구성하세요. (참고 날짜: ${dateStr}, 요소: ${skill.id})
- topic은 10자 내외의 짧은 제목으로 작성하세요.
- 제시문, 문항 어디에도 큰따옴표(")를 사용하지 마세요. 인용이 필요하면 「 」 또는 작은따옴표(')를 사용하세요.

다음 JSON 형식으로만 응답하세요:
{"topic":"...", "passages":[{"label":"가","text":"..."},{"label":"나","text":"..."}], "chart": {"title":"...","unit":"...","categories":["..."],"series":[{"name":"...","values":[0,0]}]} 또는 null, "question":"..."}`;

  const raw = await callGemini({ system, user, maxTokens: 2200, model: MODEL_GENERATE });
  const parsed = parseJsonLoose(raw);
  if (!parsed.passages || parsed.passages.length < 2 || !parsed.question) {
    throw new Error('생성된 문제 형식이 올바르지 않습니다.');
  }
  if (parsed.chart) {
    const catLen = (parsed.chart.categories || []).length;
    const seriesOk = (parsed.chart.series || []).every(s => (s.values || []).length === catLen);
    if (!catLen || !seriesOk) {
      throw new Error('생성된 도표 데이터의 길이가 맞지 않습니다.');
    }
  }
  return parsed;
}

async function gradeAnswer({ skillDesc, passages, chart, question, answerText }) {
  const system = '당신은 성균관대·고려대 인문논술 채점관입니다. 이 문제는 오직 한 가지 능력만 평가합니다. 문장력, 맞춤법, 전체 구성 등 그 외의 요소는 절대 채점에 반영하지 마세요. 채점과 별개로 학생이 비교해볼 수 있도록 이 문제에 대한 모범답안도 직접 작성하세요. 응답은 JSON 객체 하나뿐이어야 하며 다른 텍스트를 포함하지 마세요. 피드백이나 모범답안 안에서 인용부호가 필요하면 큰따옴표(") 대신 「 」 나 작은따옴표(\')를 사용하세요.';
  const chartStr = chart ? `\n[도표] ${chart.title} (단위:${chart.unit || ''}) — ${JSON.stringify(chart.series)}` : '';
  const user = `[평가 능력]
${skillDesc}

[제시문]
${passages.map(p => `(${p.label}) ${p.text}`).join('\n')}${chartStr}

[문제]
${question}

[학생 답안]
${answerText}
위 평가 능력 기준으로만 5점 만점으로 채점하고, 한국어로 3~4문장 피드백을 작성하세요. 잘한 점과 놓친 점을 구체적으로 지적하세요. 그리고 문항이 요구한 목표 분량에 맞춰, 평가 능력을 확실히 보여주는 모범답안을 직접 작성하세요. 큰따옴표(")는 절대 쓰지 마세요.
다음 JSON 형식으로만 응답하세요:
{"score": 0, "feedback": "...", "modelAnswer": "..."}`;

  const raw = await callGemini({ system, user, maxTokens: 1600, model: MODEL_GRADE });
  return parseJsonLoose(raw);
}

module.exports = { callGemini, parseJsonLoose, generateOneProblem, gradeAnswer };
