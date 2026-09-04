const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const STREAM_BASE = 'http://ahm79.store:8080';
const USERNAME = '0545580310';
const PASSWORD = '7337741654';

app.get('/stream/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    let targetUrl = '';

    if (channelId.endsWith('.m3u8')) {
      const idOnly = channelId.replace('.m3u8', '');
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${idOnly}.m3u8`;
    } else {
      targetUrl = `${STREAM_BASE}/live/${USERNAME}/${PASSWORD}/${channelId}`;
    }

    const response = await axios({
      method: 'get',
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      },
      responseType: channelId.endsWith('.m3u8') ? 'text' : 'stream',
    });

    if (channelId.endsWith('.m3u8')) {
      let playlist = response.data;
      const proxyHost = `${req.protocol}://${req.get('host')}`;
      
      // تحويل جميع مسارات المقاطع النسبية داخل m3u8 لكي تمر عبر البروكسي
      playlist = playlist.replace(/^(?!http)(.*\.ts)/gmb, `${proxyHost}/stream/$1`);
      playlist = playlist.replace(/^(?!http)(.*\.m3u8)/gmb, `${proxyHost}/stream/$1`);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(playlist);
    } else {
      res.setHeader('Content-Type', 'video/mp2t');
      return response.data.pipe(res);
    }
  } catch (error) {
    console.error('Proxy Error:', error.response ? error.response.status : error.message);
    res.status(error.response ? error.response.status : 500).send(`M3U8 Error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
