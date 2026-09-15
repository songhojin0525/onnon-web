const { generateAndStoreToday } = require('./_lib/generate');

module.exports = async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] || '';
  const querySecret = req.query && req.query.secret;
  const ok = expected && (authHeader === `Bearer ${expected}` || querySecret === expected);

  if (!ok) {
    res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    return;
  }

  try {
    const result = await generateAndStoreToday();
    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
};
