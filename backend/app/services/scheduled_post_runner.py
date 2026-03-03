import asyncio
import logging

from app.api.endpoints.social import process_due_scheduled_posts
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

logger = logging.getLogger(__name__)


async def scheduled_post_worker(poll_interval_seconds: int = 30) -> None:
    warned_missing_table = False
    while True:
        try:
            async with AsyncSessionLocal() as session:
                table_exists = await session.scalar(
                    text("SELECT to_regclass('public.scheduled_posts') IS NOT NULL")
                )
                if not table_exists:
                    if not warned_missing_table:
                        logger.warning("scheduled_posts table not found; run Alembic migration and restart backend")
                        warned_missing_table = True
                    await asyncio.sleep(poll_interval_seconds)
                    continue
                warned_missing_table = False

                processed = await process_due_scheduled_posts(session)
                if processed:
                    logger.info("Processed %s scheduled post(s)", processed)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Scheduled post worker error: %s", exc)

        await asyncio.sleep(poll_interval_seconds)
