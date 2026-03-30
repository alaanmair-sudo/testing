import json
import logging
from typing import Any, Dict, Optional

from app.config import settings

logger = logging.getLogger(__name__)


async def extract_data_from_document(
    pdf_path: str,
    checklist_item_name: str,
    permit_type_name: str,
    ocr_text: str,
) -> Dict[str, Any]:
    """Use the Anthropic Claude API to analyze document content and extract structured data.

    Sends the OCR text along with context about the expected document type to Claude,
    requesting structured analysis of the document.

    Args:
        pdf_path: Path to the PDF file (for reference).
        checklist_item_name: The expected document type from the checklist.
        permit_type_name: The permit type this document belongs to.
        ocr_text: The OCR-extracted text from the document.

    Returns:
        A dictionary containing extraction results with fields like:
        detected_document_type, matches_expected_type, confidence, key_fields,
        has_signature, has_official_stamp, dates_found, issues, summary_en, summary_ar.
    """
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not configured, returning placeholder extraction")
        return {
            "detected_document_type": "unknown",
            "matches_expected_type": False,
            "confidence": 0.0,
            "key_fields": {},
            "has_signature": False,
            "has_official_stamp": False,
            "dates_found": [],
            "issues": ["AI extraction not configured: ANTHROPIC_API_KEY is missing"],
            "summary_en": "AI extraction is not configured.",
            "summary_ar": "لم يتم تكوين الاستخراج بالذكاء الاصطناعي.",
        }

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        prompt = f"""You are a document analysis expert for the Greater Amman Municipality building permits system.

Analyze the following OCR-extracted text from a document that was submitted as part of a "{permit_type_name}" permit application.

The document is expected to be: "{checklist_item_name}"

OCR Text:
---
{ocr_text[:8000]}
---

Analyze this document and respond with ONLY a valid JSON object (no markdown, no code blocks) with the following fields:
{{
    "detected_document_type": "string - what type of document this appears to be",
    "matches_expected_type": true/false - whether this matches the expected document type "{checklist_item_name}",
    "confidence": 0.0-1.0 - confidence score for the match,
    "key_fields": {{}} - dictionary of key fields extracted from the document (e.g., names, dates, plot numbers, addresses),
    "has_signature": true/false - whether a signature appears to be present,
    "has_official_stamp": true/false - whether an official stamp/seal appears to be referenced,
    "dates_found": [] - list of dates found in the document,
    "issues": [] - list of any issues or concerns found,
    "summary_en": "Brief English summary of the document",
    "summary_ar": "Brief Arabic summary of the document"
}}"""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        response_text = message.content[0].text.strip()

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            response_text = "\n".join(lines)

        extracted = json.loads(response_text)

        required_fields = [
            "detected_document_type", "matches_expected_type", "confidence",
            "key_fields", "has_signature", "has_official_stamp",
            "dates_found", "issues", "summary_en", "summary_ar",
        ]
        for field in required_fields:
            if field not in extracted:
                extracted[field] = None

        return extracted

    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI response as JSON: %s", e)
        return {
            "detected_document_type": "parse_error",
            "matches_expected_type": False,
            "confidence": 0.0,
            "key_fields": {},
            "has_signature": False,
            "has_official_stamp": False,
            "dates_found": [],
            "issues": [f"Failed to parse AI response: {str(e)}"],
            "summary_en": "AI analysis failed due to response parsing error.",
            "summary_ar": "فشل تحليل الذكاء الاصطناعي بسبب خطأ في تحليل الاستجابة.",
        }

    except Exception as e:
        logger.error("AI extraction failed: %s", e)
        return {
            "detected_document_type": "error",
            "matches_expected_type": False,
            "confidence": 0.0,
            "key_fields": {},
            "has_signature": False,
            "has_official_stamp": False,
            "dates_found": [],
            "issues": [f"AI extraction error: {str(e)}"],
            "summary_en": f"AI extraction encountered an error: {str(e)}",
            "summary_ar": f"واجه الاستخراج بالذكاء الاصطناعي خطأ: {str(e)}",
        }
