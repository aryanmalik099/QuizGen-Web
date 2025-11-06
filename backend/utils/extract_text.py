"""
Utilities to extract text from uploaded files (PDF, DOCX, TXT).
"""
from io import BytesIO
from typing import IO

from PyPDF2 import PdfReader
from docx import Document


def extract_text_from_file(file_storage) -> str:
    """Extract text from an uploaded file (Werkzeug FileStorage).

    Supports PDF, DOCX, and TXT. Raises ValueError for unsupported/empty files.
    """
    filename = getattr(file_storage, 'filename', None)
    if not filename or '.' not in filename:
        raise ValueError('File must have an extension (.pdf, .docx, .txt)')

    ext = filename.rsplit('.', 1)[1].lower()

    # Read all bytes from the uploaded file once
    data = file_storage.read()
    if not data or len(data) == 0:
        raise ValueError('Uploaded file is empty')

    text_parts = []

    if ext == 'pdf':
        # PdfReader accepts a file-like object
        try:
            reader = PdfReader(BytesIO(data))
            for page in reader.pages:
                try:
                    page_text = page.extract_text() or ''
                except Exception:
                    page_text = ''
                text_parts.append(page_text)
        except Exception as e:
            raise ValueError(f'Failed to extract text from PDF: {e}')

    elif ext == 'docx':
        try:
            doc = Document(BytesIO(data))
            for para in doc.paragraphs:
                text_parts.append(para.text)
        except Exception as e:
            raise ValueError(f'Failed to extract text from DOCX: {e}')

    elif ext == 'txt':
        try:
            text = data.decode('utf-8', errors='ignore')
            text_parts.append(text)
        except Exception as e:
            raise ValueError(f'Failed to read TXT file: {e}')

    else:
        raise ValueError('Unsupported file type. Allowed: pdf, docx, txt')

    full_text = '\n\n'.join([p for p in text_parts if p and p.strip()])
    if not full_text.strip():
        raise ValueError('No extractable text found in the file')

    return full_text
