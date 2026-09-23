#!/usr/bin/env python3
"""Collects the web UI trace: the page posts every message it sees on the game's socket here,
and each one is appended to the log file. Run it before launching the game.

    python3 tools/webui/trace-server.py [logfile] [port]
"""
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

LOG = sys.argv[1] if len(sys.argv) > 1 else 'webui-trace.log'
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8777


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length') or 0))
        with open(LOG, 'a') as log:
            log.write(body.decode('utf-8', 'replace').rstrip() + '\n')
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def log_message(self, *args):
        pass


print(f'writing {LOG}, listening on 127.0.0.1:{PORT}')
HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
