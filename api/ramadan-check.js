function findBooleanRamadanFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'ramadan'].includes(v)) return true;
    if (['false', 'no', '0', 'not_ramadan'].includes(v)) return false;
  }
  return null;
}

function inferRamadanFromObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const directKeys = ['isRamadan', 'inRamadan', 'ramadan', 'is_ramadan', 'in_ramadan'];
  for (const key of directKeys) {
    if (key in obj) {
      const v = findBooleanRamadanFlag(obj[key]);
      if (typeof v === 'boolean') return v;
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const nested = inferRamadanFromObject(value);
      if (typeof nested === 'boolean') return nested;
    } else {
      const v = findBooleanRamadanFlag(value);
      if (typeof v === 'boolean') return v;
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, status: 'Method Not Allowed' });
  }

  const { date, latitude, longitude } = req.query || {};
  if (!date) {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Missing required query param: date (YYYY-MM-DD)',
    });
  }

  const urls = [
    `https://ramadan.munafio.com/api?date=${encodeURIComponent(String(date))}`,
    `https://ramadan.munafio.com/?date=${encodeURIComponent(String(date))}`,
  ];

  if (latitude && longitude) {
    urls.unshift(
      `https://ramadan.munafio.com/api?date=${encodeURIComponent(String(date))}&latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}`
    );
  }

  let inferred = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json, text/html' },
      });
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        inferred = inferRamadanFromObject(json);
      } else {
        const text = await response.text();
        const lowered = text.toLowerCase();
        if (lowered.includes('not ramadan')) inferred = false;
        if (inferred === null && lowered.includes('ramadan')) inferred = true;
      }

      if (typeof inferred === 'boolean') {
        return res.status(200).json({ code: 200, status: 'OK', isRamadan: inferred });
      }
    } catch {
      // Try next candidate.
    }
  }

  return res.status(200).json({
    code: 200,
    status: 'OK',
    isRamadan: null,
    message: 'Unable to infer Ramadan status from Munafio response',
  });
}
