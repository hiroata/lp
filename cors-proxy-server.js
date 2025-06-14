// 簡易CORSプロキシサーバー（開発用）
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// プロキシエンドポイント
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, headers, body } = req.body;
    
    const response = await axios({
      method: 'POST',
      url: url,
      headers: headers,
      data: body
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// 静的ファイルを提供
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 プロキシサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📁 LP自動生成ツール: http://localhost:${PORT}/index.html`);
});