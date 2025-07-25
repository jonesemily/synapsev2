const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Test route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Synapse Test</title>
        <style>
          body { font-family: Arial; margin: 40px; background: #f0f0f0; }
          .container { background: white; padding: 30px; border-radius: 10px; }
          button { background: #5b21b6; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 10px; cursor: pointer; }
          .result { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🧠 Synapse AI Learning Platform - Test</h1>
          <p>OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌'}</p>
          
          <button onclick="testHealth()">Test Health</button>
          <button onclick="testOpenAI()">Test OpenAI</button>
          
          <div id="result" class="result">
            Click a button to test the system...
          </div>
          
          <script>
            async function testHealth() {
              try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('result').innerHTML = '✅ Health Check: ' + JSON.stringify(data, null, 2);
              } catch (error) {
                document.getElementById('result').innerHTML = '❌ Health Check Failed: ' + error.message;
              }
            }
            
            async function testOpenAI() {
              try {
                const response = await fetch('/api/test-openai');
                const data = await response.json();
                document.getElementById('result').innerHTML = '🤖 OpenAI Test: ' + JSON.stringify(data, null, 2);
              } catch (error) {
                document.getElementById('result').innerHTML = '❌ OpenAI Test Failed: ' + error.message;
              }
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Simple OpenAI test
app.get('/api/test-openai', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10
    });
    
    res.json({ 
      success: true, 
      message: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Simple test server running on port', PORT);
  console.log('🌐 Open: http://localhost:' + PORT);
  console.log('🔑 OpenAI:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');
});