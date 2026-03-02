export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, status: 'Method Not Allowed' });
  }

  const { latitude, longitude, month, year } = req.query || {};
  if (!latitude || !longitude || !month || !year) {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Missing required query params: latitude, longitude, month, year',
    });
  }

  const upstream = new URL(`https://api.aladhan.com/v1/calendar/${year}/${month}`);
  upstream.searchParams.set('latitude', String(latitude));
  upstream.searchParams.set('longitude', String(longitude));
  upstream.searchParams.set('method', '1');
  upstream.searchParams.set('shafaq', 'general');
  upstream.searchParams.set('tune', '5,3,5,7,9,-1,0,8,-6');
  upstream.searchParams.set('school', '1');
  upstream.searchParams.set('timezonestring', 'Asia/Kolkata');
  upstream.searchParams.set('calendarMethod', 'UAQ');

  try {
    const response = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
    });
    const text = await response.text();

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        code: response.status,
        status: 'Upstream Error',
        message: json?.data || json?.status || 'Failed to fetch prayer calendar',
      });
    }

    if (!json || json.code !== 200 || !Array.isArray(json.data)) {
      return res.status(502).json({
        code: 502,
        status: 'Bad Gateway',
        message: 'Unexpected AlAdhan response format',
      });
    }

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      code: 200,
      status: 'OK',
      data: json.data,
    });
  } catch (error) {
    return res.status(502).json({
      code: 502,
      status: 'Bad Gateway',
      message: error?.message || 'Failed to contact prayer times provider',
    });
  }
}
