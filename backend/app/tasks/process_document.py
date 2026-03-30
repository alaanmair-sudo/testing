import asyncio
import logging

from app.tasks import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.process_document", max_retries=3)
def process_document_task(self, document_id: str) -> dict:
    """Celery task that runs the async document processing pipeline.

    This task wraps the async document_service.process_document function
    so it can be executed by Celery workers.

    Args:
        document_id: UUID string of the document to process.

    Returns:
        A dict with the processing result status.
    """
    logger.info("Starting document processing task for: %s", document_id)

    try:
        from app.services.document_service import process_document

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(process_document(document_id))
        finally:
            loop.close()

        logger.info("Document processing task completed for: %s", document_id)
        return {"status": "completed", "document_id": document_id}

    except Exception as exc:
        logger.error(
            "Document processing task failed for %s: %s", document_id, exc
        )
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
