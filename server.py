import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HOST = '0.0.0.0'
PORT = int(os.environ.get('PORT', 3000))
ROOT = os.path.dirname(os.path.abspath(__file__))

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}

orders = []
inquiries = []
subscribers = []


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            self.send_json(200, {'ok': True, 'message': 'Backend is running'})
            return

        if path == '/api/orders':
            self.send_json(200, {'orders': orders})
            return

        if path == '/api/inquiries':
            self.send_json(200, {'inquiries': inquiries})
            return

        if path == '/api/subscribers':
            self.send_json(200, {'subscribers': subscribers})
            return

        if path in ('/', '/index.html'):
            self.serve_file('index.html')
            return

        if path == '/customize.html':
            self.serve_file('customize.html')
            return

        if path == '/owner.html':
            self.serve_file('owner.html')
            return

        if path == '/script.js':
            self.serve_file('script.js')
            return

        if path == '/style.css':
            self.serve_file('style.css')
            return

        file_path = os.path.join(ROOT, path.lstrip('/'))
        if os.path.isfile(file_path):
            self.serve_file(path.lstrip('/'))
            return

        self.serve_file('index.html')

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/orders':
            data = self.read_json_body()
            order = {
                'id': f"order-{len(orders) + 1}",
                'items': data.get('items', []),
                'customerName': data.get('customerName', 'Guest'),
                'email': data.get('email', ''),
                'createdAt': self.now_iso(),
            }
            orders.append(order)
            self.send_json(201, {'success': True, 'order': order})
            return

        if path == '/api/inquiries':
            data = self.read_json_body()
            inquiry = {
                'id': f"inquiry-{len(inquiries) + 1}",
                'name': data.get('name', ''),
                'email': data.get('email', ''),
                'message': data.get('message', ''),
                'createdAt': self.now_iso(),
            }
            inquiries.append(inquiry)
            self.send_json(201, {'success': True, 'inquiry': inquiry})
            return

        if path == '/api/subscribers':
            data = self.read_json_body()
            subscriber = {
                'id': f"subscriber-{len(subscribers) + 1}",
                'email': data.get('email', ''),
                'createdAt': self.now_iso(),
            }
            subscribers.append(subscriber)
            self.send_json(201, {'success': True, 'subscriber': subscriber})
            return

        self.send_json(404, {'success': False, 'message': 'Not found'})

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') or '{}'
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {'success': False, 'message': 'Invalid JSON body'})
            raise

    def serve_file(self, relative_path):
        file_path = os.path.join(ROOT, relative_path)
        if not os.path.isfile(file_path):
            self.send_error(404, 'File not found')
            return

        ext = os.path.splitext(file_path)[1].lower()
        content_type = MIME_TYPES.get(ext, 'application/octet-stream')
        with open(file_path, 'rb') as fh:
            content = fh.read()

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, status_code, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    @staticmethod
    def now_iso():
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()


if __name__ == '__main__':
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'Server running at http://localhost:{PORT}')
    server.serve_forever()
