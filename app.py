import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 5000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 기본 경로를 public 폴더로 설정
        self.path = '/public' + self.path if not self.path.startswith('/public') else self.path
        
        # index.html, login.html 등 직접 접근
        if self.path == '/':
            self.path = '/public/index.html'
        elif self.path == '/login.html':
            self.path = '/public/login.html'
        elif self.path == '/admin.html':
            self.path = '/public/admin.html'
        elif self.path == '/solve.html':
            self.path = '/public/solve.html'
        elif self.path == '/account.html':
            self.path = '/public/account.html'
        
        return super().do_GET()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"서버 시작: http://localhost:{PORT}")
    print("종료하려면 Ctrl+C 누르세요")
    httpd.serve_forever()
