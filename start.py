#!/usr/bin/python

import SimpleHTTPServer
import SocketServer

PORT = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.webapp': 'application/x-web-app-manifest+json',
})

httpd = SocketServer.TCPServer(("", PORT), Handler)

print ("CHIP8 Emulator Running at http://localhost:"+str(PORT))
httpd.serve_forever()


