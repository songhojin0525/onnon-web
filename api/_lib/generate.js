const { pickTodaySkills, todayKST } = require('./skills');
const { generateOneProblem } = require('./gemini');
const { upsertProblems } = require('./supabase');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAndStoreToday() {
  const dateStr = todayKST();
  const skills = pickTodaySkills(dateStr);

  const problems = [];
  for (const skill of skills) {
    const result = await generateOneProblem(skill, dateStr);
    problems.push({ skill, ...result });
    await sleep(15000); // 15초 대기 (분당 5개 한도 안전하게 지키기)
  }

  await upsertProblems(dateStr, problems);
  return { dateStr, count: problems.length };
}

module.exports = { generateAndStoreToday };
