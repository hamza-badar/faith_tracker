function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseHijriMonthNumber(hijriDate) {
  if (!hijriDate || typeof hijriDate !== 'string') return 0;
  const parts = hijriDate.split('-');
  if (parts.length < 2) return 0;
  const month = Number(parts[1]);
  return Number.isFinite(month) ? month : 0;
}

async function fetchJson(url, headers = { Accept: 'application/json' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { response, text, json, networkError: null };
  } catch (error) {
    return {
      response: { ok: false, status: 599 },
      text: '',
      json: null,
      networkError: error?.message || 'Network request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeIslamicApiData(fastingRows, timezone) {
  return fastingRows
    .map((row) => {
      const isoDate = row?.date;
      const sahur = row?.time?.sahur || null;
      const iftar = row?.time?.iftar || null;
      if (!isoDate || !sahur || !iftar) return null;

      const [y, mo, d] = isoDate.split('-').map(Number);
      if (!y || !mo || !d) return null;

      return {
        timings: {
          Imsak: sahur,
          Sahur: sahur,
          Suhoor: sahur,
          Fajr: sahur,
          Sunset: iftar,
          Iftar: iftar,
          Maghrib: iftar,
        },
        date: {
          gregorian: {
            year: String(y),
            month: { number: mo },
            day: String(d),
          },
          hijri: {
            month: { number: parseHijriMonthNumber(row?.hijri) },
          },
        },
        meta: {
          timezone: timezone || 'Asia/Kolkata',
        },
      };
    })
    .filter(Boolean);
}

function buildAladhanUrl({ latitude, longitude, month, year }) {
  const url = new URL(`https://api.aladhan.com/v1/calendar/${year}/${month}`);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('method', '1');
  url.searchParams.set('shafaq', 'general');
  url.searchParams.set('tune', '5,3,5,7,9,-1,0,8,-6');
  url.searchParams.set('school', '1');
  url.searchParams.set('timezonestring', 'Asia/Kolkata');
  url.searchParams.set('calendarMethod', 'UAQ');
  return url.toString();
}

function buildIslamicApiUrl({ latitude, longitude, month, year, apiKey }) {
  const url = new URL('https://islamicapi.com/api/v1/fasting/');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('method', '1');
  url.searchParams.set('api_key', String(apiKey));
  url.searchParams.set('date', `${year}-${pad2(month)}`);
  return url.toString();
}

function toHttpStatus(status) {
  return status >= 100 && status <= 599 ? status : 502;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, status: 'Method Not Allowed' });
  }

  const { latitude, longitude, month, year, source = 'islamicapi' } = req.query || {};
  const apiKey = process.env.ISLAMIC_API_KEY;

  if (!latitude || !longitude || !month || !year) {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Missing required query params: latitude, longitude, month, year',
    });
  }

  if (source === 'islamicapi') {
    if (!apiKey) {
      return res.status(500).json({
        code: 500,
        status: 'Server Misconfigured',
        message: 'Missing ISLAMIC_API_KEY environment variable',
      });
    }

    try {
      const islamic = await fetchJson(buildIslamicApiUrl({
        latitude,
        longitude,
        month,
        year,
        apiKey,
      }), {
        Accept: 'application/json, text/plain;q=0.9, text/html;q=0.8',
      });

      const fastingRows = islamic.json?.data?.fasting;
      if (islamic.response.ok && Array.isArray(fastingRows) && fastingRows.length) {
        const normalized = normalizeIslamicApiData(fastingRows, 'Asia/Kolkata');
        if (normalized.length) {
          res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
          return res.status(200).json({
            code: 200,
            status: 'OK',
            provider: 'islamicapi',
            data: normalized,
          });
        }
      }
      const status = toHttpStatus(islamic.response.status);
      return res.status(status).json({
        code: status,
        status: 'Upstream Error',
        message:
          islamic.networkError ||
          islamic.json?.message ||
          islamic.json?.error ||
          `IslamicAPI failed with status ${islamic.response.status}`,
      });
    } catch (err) {
      return res.status(502).json({
        code: 502,
        status: 'Bad Gateway',
        message: err?.message || 'IslamicAPI request failed',
      });
    }
  }
  if (source !== 'aladhan' && source !== 'islamicapi') {
    return res.status(400).json({
      code: 400,
      status: 'Bad Request',
      message: 'Invalid source. Allowed values: islamicapi, aladhan',
    });
  }

  try {
    const aladhan = await fetchJson(buildAladhanUrl({ latitude, longitude, month, year }));
    if (!aladhan.response.ok) {
      const status = toHttpStatus(aladhan.response.status);
      return res.status(status).json({
        code: status,
        status: 'Upstream Error',
        message:
          aladhan.networkError ||
          aladhan.json?.data ||
          aladhan.json?.status ||
          'Failed to fetch prayer calendar',
      });
    }

    if (!aladhan.json || aladhan.json.code !== 200 || !Array.isArray(aladhan.json.data)) {
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
      provider: 'aladhan',
      data: aladhan.json.data,
    });
  } catch (error) {
    return res.status(502).json({
      code: 502,
      status: 'Bad Gateway',
      message: error?.message || 'Failed to contact prayer times provider',
    });
  }
}
