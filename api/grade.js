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
  const { access_token, problem, answer_text, force_zero } = body || {};

  if (!access_token || !problem) {
    res.status(400).json({ error: '요청 값이 올바르지 않습니다.' });
    return;
  }

  try {
    const user = await getUserFromToken(access_token);
    if (!user || !user.id) {
      res.status(401).json({ error: '로그인이 필요합니다. 다시 로그인해 주세요.' });
      return;
    }

    // 문제 풀이 도중 이탈 → AI 채점 없이 바로 0점 처리
    if (force_zero) {
      const saved = await insertSubmission({
        user_id: user.id,
        problem_id: problem.id || null,
        problem_date: problem.problem_date,
        topic: problem.topic,
        skill_label: problem.skill_label,
        answer_text: answer_text || '',
        score: 0,
        feedback: '문제 풀이 도중 이탈하여 자동으로 오답 처리되었습니다.',
        model_answer: '',
      });
      res.status(200).json({ ok: true, score: 0, feedback: '문제 풀이 도중 이탈하여 자동으로 오답 처리되었습니다.', modelAnswer: '', submission: saved });
      return;
    }

    if (!answer_text || String(answer_text).trim().length < 5) {
      res.status(400).json({ error: '요청 값이 올바르지 않습니다.' });
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
