const express = require('express');
const axios = require('axios');
const app = express();

const HOST = 'http://ahm79.store';
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const commonHeaders = {
  'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
  'Referer': `${HOST}/`,
  'Origin': HOST
};

// 1. معالجة قطع الـ TS
app.get('/ts/*', async (req, res) => {
  try {
    const tsPath = req.params[0];
    const targetUrl = `${HOST}/${tsPath}`;
    
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: commonHeaders
    });

    res.setHeader('Content-Type', 'video/mp2t');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).send('TS Fetch Error');
  }
});

// 2. معالجة ملف المانفيست M3U8
app.get('/stream/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const targetUrl = `${HOST}/live/0545580310/7337741654/${id}`;

    const response = await axios.get(targetUrl, { headers: commonHeaders });
    let manifestText = response.data;

    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    manifestText = manifestText.replace(/(\/hlsr\/[^\s\r\n]+)/g, `${serverOrigin}/ts$1`);

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.send(manifestText);
  } catch (err) {
    res.status(err.response?.status || 500).send('M3U8 Error: ' + err.message);
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
