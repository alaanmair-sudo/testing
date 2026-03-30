import logging
from pathlib import Path

import pytesseract
from pdf2image import convert_from_path
from PIL import Image

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file using OCR (pdf2image + pytesseract).

    Converts each page of the PDF to an image and runs Tesseract OCR
    with both English and Arabic language support.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        Concatenated OCR text from all pages.
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    pages = []
    try:
        images = convert_from_path(str(path), dpi=300)
    except Exception as e:
        logger.error("Failed to convert PDF to images: %s", e)
        raise RuntimeError(f"Failed to convert PDF to images: {e}") from e

    for i, image in enumerate(images):
        try:
            text = pytesseract.image_to_string(image, lang="eng+ara")
            pages.append(f"--- Page {i + 1} ---\n{text.strip()}")
        except Exception as e:
            logger.warning("OCR failed on page %d: %s", i + 1, e)
            pages.append(f"--- Page {i + 1} ---\n[OCR failed: {e}]")

    return "\n\n".join(pages)


def extract_text_from_image(image_path: str) -> str:
    """Extract text from an image file using OCR.

    Args:
        image_path: Path to the image file (JPG, PNG, etc.).

    Returns:
        Extracted OCR text.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    image = Image.open(str(path))
    text = pytesseract.image_to_string(image, lang="eng+ara")
    return text.strip()
