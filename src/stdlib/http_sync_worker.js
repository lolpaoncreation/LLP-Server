const http = require('http');
const https = require('https');

const rawInput = process.argv[2] || '{}';
try {
  const reqOptions = JSON.parse(rawInput);
  const targetUrl = new URL(reqOptions.url);
  const isHttps = targetUrl.protocol === 'https:';
  const transport = isHttps ? https : http;

  const bodyData = reqOptions.body || '';
  const headers = reqOptions.headers || {};
  if (bodyData && !headers['Content-Length'] && !headers['content-length']) {
    headers['Content-Length'] = Buffer.byteLength(bodyData);
  }

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: reqOptions.method || 'GET',
    headers: headers,
    timeout: reqOptions.timeout || 10000
  };

  const req = transport.request(options, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      const response = {
        status: res.statusCode || 200,
        ok: (res.statusCode >= 200 && res.statusCode < 300),
        headers: res.headers,
        body: data
      };
      process.stdout.write(JSON.stringify(response));
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    process.stdout.write(JSON.stringify({ status: 500, ok: false, error: err.message, body: '' }));
    process.exit(0);
  });

  req.on('timeout', () => {
    req.destroy();
    process.stdout.write(JSON.stringify({ status: 408, ok: false, error: 'Request timeout', body: '' }));
    process.exit(0);
  });

  if (bodyData) {
    req.write(bodyData);
  }
  req.end();
} catch (e) {
  process.stdout.write(JSON.stringify({ status: 500, ok: false, error: e.message, body: '' }));
  process.exit(0);
}
