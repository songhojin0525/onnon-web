const { gradeAnswer } = require('./_lib/gemini');
const { getUserFromToken, insertSubmission } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { access_token, problem, answer_text } = body || {};

  if (!access_token || !problem || !answer_text || String(answer_text).trim().length < 5) {
    res.status(400).json({ error: '요청 값이 올바르지 않습니다.' });
    return;
  }

  try {
    const user = await getUserFromToken(access_token);
    if (!user || !user.id) {
      res.status(401).json({ error: '로그인이 필요합니다. 다시 로그인해 주세요.' });
      return;
    }

    const result = await gradeAnswer({
      skillDesc: problem.skill_desc,
      passages: problem.passages,
      chart: problem.chart,
      question: problem.question,
      answerText: answer_text,
    });

    const score = Math.max(0, Math.min(5, Math.round(Number(result.score) || 0)));

    const saved = await insertSubmission({
      user_id: user.id,
      problem_id: problem.id || null,
      problem_date: problem.problem_date,
      topic: problem.topic,
      skill_label: problem.skill_label,
      answer_text,
      score,
      feedback: result.feedback || '',
      model_answer: result.modelAnswer || '',
    });

    res.status(200).json({ ok: true, score, feedback: result.feedback, modelAnswer: result.modelAnswer, submission: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
};
