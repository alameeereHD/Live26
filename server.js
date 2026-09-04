const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const STREAM_BASE = 'http://ahm79.store:8080';
const USERNAME = '0545580310';
const PASSWORD = '7337741654';

app.get('/stream/:segment*', async (req, res) => {
  try {
    const path = req.params.segment + (req.params[0] || '');
    let targetUrl = '';

    if (path.endsWith('.m3u8')) {
      const idOnly = path.replace('.m3u8', '');
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${idOnly}.m3u8`;
    } else if (path.startsWith('http://') || path.startsWith('https://')) {
      targetUrl = path;
    } else {
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${path}`;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };

    if (path.endsWith('.m3u8')) {
      const response = await axios.get(targetUrl, { headers, responseType: 'text' });
      let playlist = response.data;
      const proxyHost = `${req.protocol}://${req.get('host')}`;

      // توجيه كافة روابط المقاطع (.ts) لمرورها عبر البروكسي
      playlist = playlist.replace(/^(?!http)(.*\.ts)/gmb, `${proxyHost}/stream/$1`);
      playlist = playlist.replace(/^http:\/\/[^\/]+\/live\/[^\/]+\/[^\/]+\/(.*\.ts)/gmb, `${proxyHost}/stream/$1`);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(playlist);
    } else {
      // نقل بيانات مقاطع ts كـ stream مستمر
      const response = await axios.get(targetUrl, { headers, responseType: 'stream' });
      res.setHeader('Content-Type', 'video/mp2t');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).send('Stream error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
