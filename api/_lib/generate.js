const { pickTodaySkills, todayKST } = require('./skills');
const { generateOneProblem } = require('./gemini');
const { upsertProblems } = require('./supabase');

async function generateAndStoreToday() {
  const dateStr = todayKST();
  const skills = pickTodaySkills(dateStr);
  const problems = await Promise.all(
    skills.map(async skill => ({ skill, ...(await generateOneProblem(skill, dateStr)) }))
  );
  await upsertProblems(dateStr, problems);
  return { dateStr, count: problems.length };
}

module.exports = { generateAndStoreToday };
