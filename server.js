const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = process.env.PORT || 3000;
const rootDir = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

let orders = [];
let inquiries = [];
let subscribers = [];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, message: 'Backend is running' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    sendJson(res, 200, { orders });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/inquiries') {
    sendJson(res, 200, { inquiries });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/subscribers') {
    sendJson(res, 200, { subscribers });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    try {
      const body = await readBody(req);
      const order = {
        id: `order-${Date.now()}`,
        items: body.items || [],
        customerName: body.customerName || 'Guest',
        email: body.email || '',
        createdAt: new Date().toISOString()
      };
      orders.push(order);
      sendJson(res, 201, { success: true, order });
    } catch (error) {
      sendJson(res, 400, { success: false, message: error.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/inquiries') {
    try {
      const body = await readBody(req);
      const inquiry = {
        id: `inquiry-${Date.now()}`,
        name: body.name || '',
        email: body.email || '',
        message: body.message || '',
        createdAt: new Date().toISOString()
      };
      inquiries.push(inquiry);
      sendJson(res, 201, { success: true, inquiry });
    } catch (error) {
      sendJson(res, 400, { success: false, message: error.message });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/subscribers') {
    try {
      const body = await readBody(req);
      const subscriber = {
        id: `subscriber-${Date.now()}`,
        email: body.email || '',
        createdAt: new Date().toISOString()
      };
      subscribers.push(subscriber);
      sendJson(res, 201, { success: true, subscriber });
    } catch (error) {
      sendJson(res, 400, { success: false, message: error.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/') {
    serveStaticFile(res, path.join(rootDir, 'index.html'));
    return;
  }

  if (req.method === 'GET' && pathname === '/customize.html') {
    serveStaticFile(res, path.join(rootDir, 'customize.html'));
    return;
  }

  if (req.method === 'GET' && pathname === '/owner.html') {
    serveStaticFile(res, path.join(rootDir, 'owner.html'));
    return;
  }

  if (req.method === 'GET' && pathname === '/script.js') {
    serveStaticFile(res, path.join(rootDir, 'script.js'));
    return;
  }

  if (req.method === 'GET' && pathname === '/style.css') {
    serveStaticFile(res, path.join(rootDir, 'style.css'));
    return;
  }

  const filePath = path.join(rootDir, pathname.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStaticFile(res, filePath);
  } else {
    serveStaticFile(res, path.join(rootDir, 'index.html'));
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
