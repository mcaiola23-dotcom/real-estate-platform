from fastapi import APIRouter
from typing import Optional, Dict, Any
from ..schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")

@router.get("/db")
async def database_check():
    """Database connection check."""
    try:
        from ...db import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}


def _serialize_import_audit(audit) -> Optional[Dict[str, Any]]:
    if not audit:
        return None
    return {
        "id": audit.id,
        "source": audit.source,
        "run_type": audit.run_type,
        "status": audit.status,
        "started_at": audit.started_at.isoformat() if audit.started_at else None,
        "completed_at": audit.completed_at.isoformat() if audit.completed_at else None,
        "since": audit.since.isoformat() if audit.since else None,
        "counts": {
            "fetched": audit.fetched,
            "imported": audit.imported,
            "updated": audit.updated,
            "matched": audit.matched,
            "skipped": audit.skipped,
            "errors": audit.errors,
        },
        "message": audit.message,
    }


@router.get("/mls")
async def mls_import_health():
    """Report MLS import freshness and last run stats."""
    from ...db import SessionLocal
    from ...models.import_audit import ImportAudit

    db = SessionLocal()
    try:
        last_run = db.query(ImportAudit).order_by(ImportAudit.started_at.desc()).first()
        if not last_run:
            return {
                "status": "unknown",
                "message": "No MLS import audits found",
                "last_run": None,
                "last_successful_run": None,
            }

        last_successful = (
            db.query(ImportAudit)
            .filter(ImportAudit.status == "success")
            .order_by(ImportAudit.completed_at.desc())
            .first()
        )

        return {
            "status": "ok" if last_successful else "error",
            "last_run": _serialize_import_audit(last_run),
            "last_successful_run": _serialize_import_audit(last_successful),
        }
    finally:
        db.close()

