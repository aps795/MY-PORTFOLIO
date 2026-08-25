import io
import json
import os
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional, Tuple

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(ROOT_DIR, "thinkora.html")
INDEX_FILE = os.path.join(ROOT_DIR, "index.html")
DASHBOARD_FILE = os.path.join(ROOT_DIR, "dashboard.html")
KNOWLEDGE_FILE = os.path.join(ROOT_DIR, "knowledge.json")

def _get_storage_paths():
    if os.path.exists("/tmp") and os.access("/tmp", os.W_OK):
        db_path = "/tmp/study_history.db"
        upload_dir = "/tmp/uploads"
    else:
        db_path = os.path.join(ROOT_DIR, "study_history.db")
        upload_dir = os.path.join(ROOT_DIR, "uploads")
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except Exception:
        pass
    return db_path, upload_dir


DB_PATH, UPLOAD_DIR = _get_storage_paths()


class StudyHistoryStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._memory_fallback = []
        self._init_db()

    def _init_db(self):
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute(
                "CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)"
            )
            conn.commit()
            conn.close()
        except Exception:
            self.db_path = ":memory:"
            try:
                conn = sqlite3.connect(self.db_path)
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)"
                )
                conn.commit()
                conn.close()
            except Exception:
                pass

    def save(self, role: str, message: str):
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute(
                "INSERT INTO chats(role, message, created_at) VALUES (?, ?, datetime('now'))",
                (role, message),
            )
            conn.commit()
            conn.close()
        except Exception:
            self._memory_fallback.append({
                "role": role,
                "message": message,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })

    def get_recent(self, limit: int = 8):
        try:
            conn = sqlite3.connect(self.db_path)
            rows = conn.execute(
                "SELECT role, message, created_at FROM chats ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
            conn.close()
            if rows:
                return [{"role": role, "message": message, "created_at": created_at} for role, message, created_at in rows[::-1]]
        except Exception:
            pass
        return self._memory_fallback[-limit:]


class SmartAssistant:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.provider = os.getenv("AI_PROVIDER", "openai" if self.openai_key else "gemini" if self.gemini_key else "local")
        self.knowledge = self._load_knowledge()

    def _load_knowledge(self):
        paths_to_check = [
            KNOWLEDGE_FILE,
            os.path.join(ROOT_DIR, "knowledge.json"),
            "knowledge.json",
        ]
        for p in paths_to_check:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as handle:
                        return json.load(handle)
                except Exception:
                    pass
        return {"general_science": [], "indian_gk": []}

    def _lookup_knowledge(self, message: str) -> Optional[str]:
        text = re.sub(r"[^a-z0-9]+", " ", message.lower()).strip()
        for item in self.knowledge.get("general_science", []) + self.knowledge.get("indian_gk", []):
            keywords = [str(keyword).lower().strip() for keyword in item.get("keywords", []) if str(keyword).strip()]
            if any(keyword in text for keyword in keywords):
                return item.get("answer")
        return None

    def get_reply(self, message: str) -> str:
        knowledge_reply = self._lookup_knowledge(message)
        if knowledge_reply:
            return knowledge_reply
        if self.provider == "openai" and self.openai_key:
            return self._call_openai(message)
        if self.provider == "gemini" and self.gemini_key:
            return self._call_gemini(message)
        return self._fallback_reply(message)

    def _call_openai(self, message: str) -> str:
        try:
            req_data = json.dumps({
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are Thinkora AI, a smart study and general assistant for students."},
                    {"role": "user", "content": message},
                ],
                "temperature": 0.7,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=req_data,
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            return self._fallback_reply(message)

    def _call_gemini(self, message: str) -> str:
        try:
            req_data = json.dumps({
                "contents": [{"parts": [{"text": message}]}],
                "generationConfig": {"temperature": 0.7},
            }).encode("utf-8")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}"
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            return self._fallback_reply(message)

    def _fallback_reply(self, message: str) -> str:
        text = message.lower().strip()
        if any(keyword in text for keyword in ["quiz", "mcq", "test"]):
            return "I can create a quick quiz with 5 MCQs, explain the answer key, and turn it into a practice set for exam prep."
        if any(keyword in text for keyword in ["general science", "science", "physics", "chemistry", "biology"]):
            return "I can explain general science topics such as photosynthesis, gravity, the human body, and the solar system in simple words."
        if any(keyword in text for keyword in ["gk", "india", "indian"]):
            return "I can answer Indian GK questions about the capital, national symbols, independence, rivers, and important leaders."
        if any(keyword in text for keyword in ["note", "notes", "revision"]):
            return "I can generate structured study notes, key points, and a simple revision checklist for your topic."
        if any(keyword in text for keyword in ["math", "equation", "solve"]):
            return "I can solve problems step by step and explain the logic clearly so it feels easy to follow."
        if any(keyword in text for keyword in ["code", "python", "program"]):
            return "I can help write code, debug errors, and explain each part in a beginner-friendly way."
        if any(keyword in text for keyword in ["pdf", "summary", "document"]):
            return "Upload a PDF or document and I can summarize it, extract key points, and answer questions from it."
        if any(keyword in text for keyword in ["ncert", "chapter", "subject"]):
            return "I can explain NCERT topics in simple language, give examples, and turn them into notes or flashcards."
        return (
            "I’m Thinkora AI, your smart study and general assistant. I can explain concepts, create notes, solve quiz questions, "
            "help with coding, and support your learning in real time."
        )


assistant = SmartAssistant()
history_store = StudyHistoryStore(DB_PATH)


def parse_multipart_file(raw_bytes: bytes, content_type: str) -> Tuple[Optional[str], Optional[bytes]]:
    match = re.search(r'boundary=([^;]+)', content_type, re.IGNORECASE)
    if not match:
        return None, None
    boundary = match.group(1).strip('"\'').encode('utf-8')
    parts = raw_bytes.split(b'--' + boundary)
    for part in parts:
        if b'filename=' in part:
            header_part, _, body = part.partition(b'\r\n\r\n')
            if body.endswith(b'\r\n'):
                body = body[:-2]
            header_text = header_part.decode('utf-8', errors='ignore')
            match_fn = re.search(r'filename="([^"]+)"', header_text)
            filename = match_fn.group(1) if match_fn else "uploaded_file"
            return filename, body
    return None, None


class Handler(BaseHTTPRequestHandler):
    server_version = "ThinkoraAI/2.0"

    def do_OPTIONS(self):
        self._send_json(200, {})

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        if not path:
            path = "/"

        if path == "/api/health":
            self._send_json(200, {"status": "ok", "provider": assistant.provider})
            return

        if path == "/api/history":
            limit = 8
            if parsed.query:
                query_params = urllib.parse.parse_qs(parsed.query)
                if "limit" in query_params:
                    try:
                        limit = int(query_params["limit"][0])
                    except (IndexError, ValueError):
                        limit = 8
            self._send_json(200, {"history": history_store.get_recent(limit)})
            return

        if path in ["", "/", "/index.html", "/thinkora.html"]:
            target = INDEX_FILE if os.path.exists(INDEX_FILE) else HTML_FILE
            self._serve_file(target)
            return

        if path in ["/dashboard", "/dashboard.html"]:
            self._serve_file(DASHBOARD_FILE)
            return

        self._send_json(404, {"error": "not found"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/api/chat":
            self._handle_chat()
            return
        if path == "/api/stream":
            self._handle_stream()
            return
        if path == "/api/upload":
            self._handle_upload()
            return

        self._send_json(404, {"error": "not found"})

    def _handle_chat(self):
        payload = self._read_json()
        message = (payload or {}).get("message", "")
        if message:
            history_store.save("user", message)
            reply = assistant.get_reply(message)
            history_store.save("assistant", reply)
        else:
            reply = "Please enter a message to chat."
        self._send_json(200, {"reply": reply, "provider": assistant.provider})

    def _handle_stream(self):
        payload = self._read_json()
        message = (payload or {}).get("message", "")
        if message:
            history_store.save("user", message)
            full_reply = assistant.get_reply(message)
            history_store.save("assistant", full_reply)
        else:
            full_reply = "Please enter a message."

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

        words = re.findall(r"\S+\s*", full_reply)
        if not words:
            words = [full_reply]

        for word in words:
            chunk = word if word.endswith(" ") else word + " "
            msg_bytes = f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
            try:
                self.wfile.write(msg_bytes)
                self.wfile.flush()
            except Exception:
                return
            time.sleep(0.02)

        try:
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
        except Exception:
            pass

    def _handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self._send_json(400, {"error": "expected multipart/form-data"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b""
        filename, file_bytes = parse_multipart_file(raw, content_type)

        if not filename or not file_bytes:
            self._send_json(400, {"error": "no file provided or parsing failed"})
            return

        safe_name = os.path.basename(filename)
        save_path = os.path.join(UPLOAD_DIR, f"{int(time.time())}_{safe_name}")
        try:
            with open(save_path, "wb") as handle:
                handle.write(file_bytes)
        except Exception:
            pass

        history_store.save("upload", f"Uploaded document: {safe_name}")
        self._send_json(
            200,
            {
                "saved": True,
                "filename": safe_name,
                "path": save_path,
                "summary": f"Saved {safe_name} for later study review and note generation.",
            },
        )

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="ignore") if length else "{}"
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}

    def _serve_file(self, path: str):
        try:
            with open(path, "rb") as fh:
                content = fh.read()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception:
            self._send_json(500, {"error": "Failed to read file"})

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass


handler = Handler

if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    print("Thinkora AI server running at http://127.0.0.1:8000")
    server.serve_forever()
