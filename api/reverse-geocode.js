export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, status: 'Method Not Allowed' });
  }

  const { lat, lon } = req.query || {};
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      code: 500,
      status: 'Server Misconfigured',
      message: 'Missing GEOAPIFY_API_KEY environment variable',
    });
  }

  if (!lat || !lon) {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Missing required query params: lat, lon',
    });
  }

  const upstream = new URL('https://api.geoapify.com/v1/geocode/reverse');
  upstream.searchParams.set('lat', String(lat));
  upstream.searchParams.set('lon', String(lon));
  upstream.searchParams.set('apiKey', String(apiKey));

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
        message: json?.message || 'Failed to fetch reverse geocode',
      });
    }

    const props = json?.features?.[0]?.properties || {};
    return res.status(200).json({
      code: 200,
      status: 'OK',
      data: {
        name: props.name || null,
        city: props.city || props.town || props.village || null,
        postcode: props.postcode || null,
        state: props.state || null,
        country: props.country || null,
        formatted: props.formatted || null,
      },
    });
  } catch {
    return res.status(502).json({
      code: 502,
      status: 'Bad Gateway',
      message: 'Failed to contact location provider',
    });
  }
}
