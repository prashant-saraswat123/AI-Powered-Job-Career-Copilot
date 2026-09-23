from pathlib import Path

import pymupdf as fitz

from docx import Document

def extract_text_from_pdf(file_path: str) -> str:
    document = fitz.open(file_path)
    text = ""
    for page in document:
        text += page.get_text()
    document.close()
    return text

def extract_text_from_docx(file_path: str) -> str:
    document = Document(file_path)
    text = ""
    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"
    return text

def extract_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()
    if extension == ".pdf":
        return extract_text_from_pdf(file_path)
    elif extension == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(
            "Unsupported file type. Only PDF and DOCX are supported."
        )
    