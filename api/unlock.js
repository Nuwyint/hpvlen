const { createHash, timingSafeEqual } = require('node:crypto');

const normalize = text => text.trim().toLowerCase();
const digest = text => createHash('sha256').update(text).digest();

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Метод не поддерживается.' });
  }
  const expected = process.env.QUEST_PASSWORD;
  if (!expected || !expected.trim()) {
    return res.status(503).json({ error: 'Канал временно недоступен. Обратитесь к организатору.' });
  }
  let body;
  try { body = req.body; }
  catch { return res.status(400).json({ error: 'Не удалось прочитать сообщение.' }); }
  if (typeof body === 'string') {
    if (body.length > 2048) return res.status(413).json({ error: 'Сообщение слишком длинное.' });
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Не удалось прочитать сообщение.' }); }
  }
  const password = body && body.password;
  if (typeof password !== 'string' || password.length > 80 || !password.trim()) {
    return res.status(400).json({ error: 'Введите код доступа.' });
  }
  if (!timingSafeEqual(digest(normalize(password)), digest(normalize(expected)))) {
    return res.status(401).json({ error: 'Код не распознан. Проверьте выводы и повторите попытку.' });
  }
  return res.status(200).json({
    label: '15 НОЯБРЯ · ОСОБАЯ ПЕРЕДАЧА',
    title: 'Антон,\nс днём рождения!',
    paragraphs: [
      'Сегодня главный герой игры — ты.',
      'Обычно ты придумываешь задания, а мы ищем ответы. Сегодня мы поменялись ролями, чтобы сказать: спасибо за игры, азарт и поводы собираться вместе!',
      'Пусть сложные шифры сходятся, нужные повороты находятся вовремя, а рядом всегда будет своя команда. Желаем тебе ярких идей, крутых приключений и счастья далеко за пределами игры. Пусть удача всегда будет на твоей стороне!'
    ],
    signature: 'ОТ ИГРОКОВ — ОРГАНИЗАТОРУ · ENCOUNTER',
    footer: 'МИССИЯ НА СЕГОДНЯ: ПРИНИМАТЬ ПОЗДРАВЛЕНИЯ'
  });
};
