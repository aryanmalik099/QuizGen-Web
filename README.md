# QuizGen — AI Quiz Generator

QuizGen is a small web project that generates multiple-choice quizzes from uploaded documents (PDF, DOCX, TXT) using an AI model. It includes a Python Flask backend that accepts a file upload, extracts text, asks an AI to generate 10 MCQs, and returns the quiz as JSON. A lightweight React frontend (Vite) provides a UI to upload files and view/download quizzes.

## Features

- Upload a PDF, DOCX, or TXT file and extract text server-side.
- Ask an AI (OpenAI / Google Gemini depending on configuration) to produce exactly 10 multiple-choice questions with 4 options each and a correct answer index.
- Endpoints:
  - `GET /health` — health check, returns `{ "status": "running" }`.
  - `POST /generate-quiz` — multipart file upload (field name `file`), returns `{ "quiz": [ ... ] }`.
- CORS enabled on the backend so the frontend can access the API.

## Repo layout

```
/backend    # Flask backend (python)
/frontend   # React frontend (Vite)
README.md
.gitignore
```

## Quick start (Backend)

Prerequisites
- Python 3.10+ (use a virtualenv)
- Windows PowerShell (examples below are PowerShell-compatible)

Install and run

```powershell
cd C:\Users\utkar\Desktop\QuizGen\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see `Env` section below). Then run the app:

```powershell
python app.py
```

The server will start on the port configured in `app.py` (default: 5000) and will be reachable at `http://localhost:5000`.

## Quick start (Frontend)

The frontend is a Vite + React app located in `/frontend` (if present).

```powershell
cd C:\Users\utkar\Desktop\QuizGen\frontend
npm install
npm run dev
```

Open the dev server URL displayed by Vite (usually `http://localhost:5173`). The UI uses the backend endpoints to generate quizzes.

## Endpoints and usage

Health check

```powershell
# PowerShell - simple GET
Invoke-RestMethod -Uri http://localhost:5000/health -Method Get
```

Generate quiz (file upload)

Using curl (Linux/macOS or WSL):

```bash
curl -X POST -F "file=@/path/to/document.pdf" http://localhost:5000/generate-quiz
```

Using PowerShell (Invoke-RestMethod) for a file upload:

```powershell
$FilePath = 'C:\path\to\document.pdf'
$Form = @{ file = Get-Item $FilePath }
Invoke-RestMethod -Uri http://localhost:5000/generate-quiz -Method Post -Form $Form
```

Response format (successful):

```json
{
  "quiz": [
    {
      "question": "What is ...?",
      "options": ["A","B","C","D"],
      "answer_index": 2
    },
    ... 10 items total ...
  ]
}
```

Errors are returned with appropriate HTTP status codes and a JSON error message, e.g. `{ "error": "File type not supported" }`.

## Env / Secrecy

The backend expects API keys in a `.env` file (stored locally only) for whichever AI provider you configure. Example `.env` (DO NOT commit this file):

```
# backend/.env
# Either GEMINI_API_KEY or OPENAI_API_KEY depending on which generator you use
GEMINI_API_KEY=ya29.xxxxx
OPENAI_API_KEY=sk-xxxxx
```

Important security notes:
- Do NOT commit `.env` to version control. This project has had `backend/.env` removed from history — if keys were exposed before the cleanup you must rotate them immediately.
- After rotating keys, update your local `.env` and restart the backend.

If you want to provide a template for collaborators, add `backend/.env.example` with placeholder keys and commit that instead.

## AI provider selection

This repo contains utilities for calling an AI model. Depending on the file present in `backend/` the code may call OpenAI or Google Gemini. Check `backend/utils` and `backend/generate_quiz.py` to see which client the app is using. Configure the corresponding environment variable and follow that provider's SDK setup instructions.

## Development notes

- Text extraction relies on `PyPDF2` for PDFs and `python-docx` for DOCX files. Plain `.txt` files are handled by decoding with UTF-8.
- The backend validates files by extension (`.pdf`, `.docx`, `.txt`) and will return `400 Bad Request` for unsupported types.
- The AI prompt expects JSON output (an array of 10 MCQs). The backend parses this JSON and returns it; if the AI returns malformed JSON an error is returned.

## Git and remote history

If you previously committed secrets to the repository and then removed them, note:
- The repo history may have been rewritten and force-pushed. After a forced history rewrite every collaborator must re-clone the repository.
- Recommended collaborator steps after a forced push:
  1. Backup any local uncommitted work.
  2. Delete the local clone.
  3. Clone the repository again from the remote.

## Testing the flow

1. Start the backend (`python app.py`).
2. Use the PowerShell `Invoke-RestMethod` snippet above to POST a small test `.txt` file and confirm you receive a `quiz` array with 10 items.

## Next steps / Improvements

- Add unit tests for `extract_text_from_file` and for the generator wrapper (mock the AI client).
- Add integration tests hitting the Flask endpoints (using pytest + test client).
- Add CI to run tests and linting on pull requests.
- Add `backend/.env.example` and document how to obtain/rotate API keys.

## License

Add your preferred license or leave this section as-is. If this is for private use you can omit an OSI license.

---

If you'd like, I can:
- Add a `backend/.env.example` file with placeholders.
- Add a short `CONTRIBUTING.md` describing how to set up and re-clone after the history rewrite.
- Create a small test suite for the backend functions.

Tell me which of those you'd like next.