const STREAM_BASE = 'http://ahm79.store:8080';
const USERNAME = '0545580310';
const PASSWORD = '7337741654';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // معالجة طلبات Preflight لفك حظر CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const path = url.pathname.replace(/^\/stream\//, '');

    if (!path || path === '/') {
      return new Response('Alameeere TV Proxy is Active', { status: 200 });
    }

    let targetUrl = '';
    if (path.endsWith('.m3u8')) {
      const idOnly = path.replace('.m3u8', '');
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${idOnly}.m3u8`;
    } else if (path.includes('/live/')) {
      targetUrl = `${STREAM_BASE}${path}`;
    } else {
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${path}`;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*'
        }
      });

      if (path.endsWith('.m3u8')) {
        let text = await response.text();
        const workerHost = `${url.protocol}//${url.host}`;

        // إعادة توجيه مقاطع .ts لتمر عبر البروكسي بنفس الطريقة
        text = text.replace(/^(?!http)(.*\.ts)/gmb, `${workerHost}/stream/$1`);
        text = text.replace(/^http:\/\/[^\/]+\/live\/[^\/]+\/[^\/]+\/(.*\.ts)/gmb, `${workerHost}/stream/$1`);

        return new Response(text, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          }
        });
      }

      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (e) {
      return new Response('Proxy Error: ' + e.message, { status: 500 });
    }
  }
};
