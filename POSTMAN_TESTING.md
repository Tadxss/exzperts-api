# Testing with Postman

## 🧪 Local Testing Setup

Since this is a Lambda function, you'll need to simulate the Lambda environment locally or test directly after deployment.

### Option 1: Test After AWS Lambda Deployment (Recommended)

1. Deploy to AWS Lambda (see README.md)
2. Get your Lambda Function URL
3. Use that URL in Postman

### Option 2: Create Local Server Wrapper

If you want to test locally before deployment, create a simple Express server wrapper:

**Create `server.js`:**

```javascript
const express = require('express');
const { handler } = require('./index');
const app = express();
const PORT = 3000;

app.use(express.json());

app.all('*', async (req, res) => {
  // Simulate Lambda event
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query,
    body: JSON.stringify(req.body)
  };

  try {
    const result = await handler(event);
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```*
