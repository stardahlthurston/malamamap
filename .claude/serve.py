import os
os.chdir('/Users/stardahl-thurston/Desktop/MALAMA_MAP_CODE')
from http.server import HTTPServer, SimpleHTTPRequestHandler
print('Serving Mālama Map on http://localhost:8080', flush=True)
HTTPServer(('', 8080), SimpleHTTPRequestHandler).serve_forever()
