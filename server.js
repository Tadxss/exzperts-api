require('dotenv').config();
const express = require('express');
const { handler } = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Lambda handler wrapper
async function handleRequest(req, res) {
  console.log(`\n📨 Incoming ${req.method} request to ${req.path}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Simulate Lambda event structure
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
    requestContext: {
      http: {
        method: req.method
      }
    }
  };

  try {
    const result = await handler(event);
    
    console.log(`\n✅ Response Status: ${result.statusCode}`);
    
    // Set headers from Lambda response
    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.setHeader(key, result.headers[key]);
      });
    }
    
    // Send response
    res.status(result.statusCode).send(result.body);
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      status: 'failed',
      error: error.message 
    });
  }
}

// Routes
app.post('/', handleRequest);
app.get('/', handleRequest);
app.options('/', handleRequest);

app.listen(PORT, () => {
  console.log(`\n🚀 Local Lambda simulator running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`\n💡 Test with Postman:`);
  console.log(`   Method: POST`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Headers: Content-Type: application/json`);
  console.log(`\n⏹  Press Ctrl+C to stop\n`);
});

