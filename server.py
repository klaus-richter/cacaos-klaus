import http.server
import socketserver
import os
import sys
import json
import subprocess
import datetime
import webbrowser
import shutil

PORT = 8080
PROJ_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJ_DIR)

VERSIONES_DIR = os.path.join(PROJ_DIR, "versiones")
os.makedirs(VERSIONES_DIR, exist_ok=True)

GIT_EXE = os.path.join(PROJ_DIR, "..", "git-portable", "bin", "cmd", "git.exe")
if not os.path.exists(GIT_EXE):
    GIT_EXE = "git"

GH_EXE = r"C:\Program Files\GitHub CLI\gh.exe"

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/save-and-publish":
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length).decode('utf-8')

                timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                index_path = os.path.join(PROJ_DIR, "index.html")
                editor_path = os.path.join(PROJ_DIR, "editor.html")

                # 1. Respaldar versión anterior
                if os.path.exists(index_path):
                    backup_file = os.path.join(VERSIONES_DIR, f"index_{timestamp}.html")
                    shutil.copyfile(index_path, backup_file)
                    print(f"[Backup] Versión respaldada: {backup_file}")

                # 2. Guardar nuevo index.html
                with open(index_path, "w", encoding="utf-8") as f:
                    f.write(post_data)

                # 3. Actualizar editor.html
                css_tag = '  <link rel="stylesheet" href="assets/css/visual-editor.css" />\n</head>'
                js_tag = '  <script src="assets/js/visual-editor.js" defer></script>\n</body>'
                editor_html = post_data.replace('</head>', css_tag).replace('</body>', js_tag)
                with open(editor_path, "w", encoding="utf-8") as f:
                    f.write(editor_html)

                # 4. Push en segundo plano a GitHub Pages
                token = ""
                if os.path.exists(GH_EXE):
                    try:
                        token = subprocess.check_output([GH_EXE, "auth", "token"], text=True).strip()
                    except Exception:
                        pass

                env = os.environ.copy()
                env["GIT_TERMINAL_PROMPT"] = "0"
                subprocess.run([GIT_EXE, "add", "-A"], capture_output=True, env=env)
                subprocess.run([GIT_EXE, "commit", "-m", f"update ({timestamp}): edicion visual automatica con versionado"], capture_output=True, env=env)
                
                if token:
                    remote_url = f"https://klaus-richter:{token}@github.com/klaus-richter/cacaos-klaus.git"
                    subprocess.run([GIT_EXE, "-c", "credential.helper=", "push", remote_url, "main:main"], capture_output=True, env=env)
                else:
                    subprocess.run([GIT_EXE, "push", "origin", "main"], capture_output=True, env=env)

                print("✅ [Auto-Publish] Guardado, versionado y subido a GitHub Pages.")

                response = {
                    "status": "ok",
                    "message": "¡Publicado exitosamente en GitHub Pages!",
                    "version": f"index_{timestamp}.html",
                    "url": "https://klaus-richter.github.io/cacaos-klaus/"
                }
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_error(404)

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == "__main__":
    server = ThreadingServer(("localhost", PORT), Handler)
    print("==========================================================")
    print(f" 🎨 Editor Visual Cacao's Klaus Activo en:")
    print(f" 👉 http://localhost:{PORT}/editor.html")
    print(f" 📁 Versiones respaldadas en: \\versiones\\")
    print("==========================================================")
    print("Presiona Ctrl+C para detener el servidor.\n")

    webbrowser.open(f"http://localhost:{PORT}/editor.html")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
