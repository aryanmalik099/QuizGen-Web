from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import os, time, json, pdfplumber, tempfile, pytesseract
from pdf2image import convert_from_path
from dotenv import load_dotenv
from quiz_generator import generate_quiz

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------------------
#  Generate Quiz from Text Input
# -------------------------------
@app.route("/generate", methods=["POST"])
def generate():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Empty or invalid JSON"}), 400

        topic = data.get("topic", "").strip()
        difficulty = data.get("difficulty", "medium")
        num_questions = int(data.get("num_questions", 10))
        num_questions = max(1, min(50, num_questions))


        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        quiz = generate_quiz(topic, difficulty=difficulty, num_questions=num_questions)
        return jsonify({"quiz": quiz}), 200

    except Exception as e:
        print("Error in /generate:", e)
        return jsonify({"error": str(e)}), 500




# -------------------------------
#  Generate Quiz from PDF Upload
# -------------------------------
@app.route("/upload", methods=["POST"])
def upload_pdf():
    def generate_stream():
        try:
            fast_mode = request.args.get("fast", "false").lower() == "true"
            difficulty = request.args.get("difficulty", "medium")
            num_questions = int(request.args.get("num_questions", 10))
            num_questions = max(1, min(50, num_questions))


            if "file" not in request.files:
                yield json.dumps({"error": "No file uploaded"}) + "\n"
                return

            file = request.files["file"]
            if not file.filename.endswith(".pdf"):
                yield json.dumps({"error": "Only PDF files allowed"}) + "\n"
                return

            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)

            text = ""

            if not fast_mode:
                with pdfplumber.open(filepath) as pdf:
                    total_pages = len(pdf.pages)
                    for i, page in enumerate(pdf.pages, 1):
                        yield json.dumps({"status": f"Extracting text (page {i}/{total_pages})..."}) + "\n"
                        text += page.extract_text() or ""

            if fast_mode or not text.strip():
                yield json.dumps({"status": "Running OCR (image-based PDF detected)..."}) + "\n"
                with tempfile.TemporaryDirectory() as tempdir:
                    pages = convert_from_path(filepath, dpi=200, output_folder=tempdir)
                    for i, page in enumerate(pages):
                        yield json.dumps({"status": f"OCR processing page {i+1}/{len(pages)}..."}) + "\n"
                        text += pytesseract.image_to_string(page)


            if not text.strip():
                yield json.dumps({"error": "Could not extract any readable text from the PDF."}) + "\n"
                return

            # Split into manageable chunks
            CHUNK_SIZE = 3500
            chunks = [text[i:i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
            total_chunks = len(chunks)
            all_quizzes = []

            questions_per_chunk = max(1, num_questions // len(chunks))
            extra = num_questions % len(chunks)

            for idx, chunk in enumerate(chunks, 1):
                this_chunk_qs = questions_per_chunk + (1 if idx <= extra else 0)
                yield json.dumps({
                    "status": f"Generating quiz for chunk {idx}/{total_chunks} ({this_chunk_qs} questions)..."
                }) + "\n"

                try:
                    quiz = generate_quiz(chunk, difficulty=difficulty, num_questions=this_chunk_qs)
                    all_quizzes.append(f"\n--- Section {idx} ---\n{quiz}")
                except Exception as inner_error:
                    yield json.dumps({
                        "status": f"⚠️ Skipping chunk {idx} due to error: {str(inner_error)}"
                    }) + "\n"
                    continue

            full_quiz = "\n\n".join(all_quizzes)

            if not full_quiz.strip():
                yield json.dumps({"error": "Quiz generation failed for all chunks."}) + "\n"
                return

            try:
                file.close()
            except Exception:
                pass
            for _ in range(3):
                try:
                    os.remove(filepath)
                    break
                except PermissionError:
                    time.sleep(0.5)

            yield json.dumps({"done": True, "quiz": full_quiz}) + "\n"

        except Exception as e:
            print("Upload error:", e)
            yield json.dumps({"error": str(e)}) + "\n"

    return Response(stream_with_context(generate_stream()), mimetype="text/event-stream")


# -------------------------------
#  Streamed Progress Debug Route
# -------------------------------
@app.route("/progress")
def progress():
    """Stream OCR progress updates (optional debug)."""
    def stream():
        last = ""
        while True:
            if os.path.exists("progress.log"):
                with open("progress.log") as f:
                    data = f.read().strip()
                if data != last:
                    last = data
                    yield f"data: {json.dumps({'progress': data})}\n\n"
            time.sleep(1)
    return Response(stream(), mimetype="text/event-stream")


# -------------------------------
#  Main Entry
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)