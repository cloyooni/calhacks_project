// Simple proxy server to handle Composio API calls and CORS
import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();

app.use(cors());
app.use(express.json());

// Helper function to make HTTPS requests
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data),
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Proxy endpoint for Composio email sending
app.post('/api/send-email', async (req, res) => {
  try {
    const { authToken, recipient_email, subject, body, is_html } = req.body;

    console.log('Received email request:', { recipient_email, subject, is_html });
    
    // OPTION 1: If authToken is a Gmail OAuth bearer token, use Gmail API directly
    if (authToken) {
      console.log('Using Gmail API with bearer token...');
      const response = await makeRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: Buffer.from(
            `To: ${recipient_email}\r\n` +
            `Subject: ${subject}\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n\r\n${body}`
          ).toString('base64url')
        }),
      });

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        return res.status(response.status).json({ error: errorText });
      }

      const result = await response.json();
      console.log(`✅ Email sent successfully to ${recipient_email}`);
      return res.json({ success: true, message: 'Email sent successfully' });
    }
    
    // If no valid token, return error
    return res.status(401).json({ error: 'No valid authentication token provided' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Email proxy server running on http://localhost:${PORT}`);
});

