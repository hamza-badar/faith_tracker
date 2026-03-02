export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, status: 'Method Not Allowed' });
  }

  const { latitude, longitude, month, year, method = '2' } = req.query || {};
  if (!latitude || !longitude || !month || !year) {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Missing required query params: latitude, longitude, month, year',
    });
  }

  const upstream = new URL('https://api.aladhan.com/v1/calendar');
  upstream.searchParams.set('latitude', String(latitude));
  upstream.searchParams.set('longitude', String(longitude));
  upstream.searchParams.set('month', String(month));
  upstream.searchParams.set('year', String(year));
  upstream.searchParams.set('method', String(method));

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });
    const body = await response.text();

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(body);
  } catch {
    return res.status(502).json({
      code: 502,
      status: 'Bad Gateway',
      message: 'Failed to contact prayer times provider',
    });
  }
}
