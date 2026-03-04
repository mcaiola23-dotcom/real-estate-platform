from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.db as db_module
from app.core.auth import get_current_user
from app.core.config import settings
from app.db import get_db
from app.main import app
from app.models.import_audit import ImportAudit
from app.models.lead import Lead
from app.services.lead_routing import LeadRoutingService


# Avoid startup table-creation side effects in route tests.
app.router.on_startup.clear()


@dataclass
class FakeImportAudit:
    id: int
    source: str
    run_type: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    since: datetime | None = None
    fetched: int = 0
    imported: int = 0
    updated: int = 0
    matched: int = 0
    skipped: int = 0
    errors: int = 0
    message: str | None = None


@dataclass
class FakeLead:
    id: int | None
    name: str
    email: str
    status: str
    created_at: datetime
    is_active: bool = True
    phone: str | None = None
    message: str | None = None
    source: str | None = "website"
    lead_score: int | None = 0
    interested_property_id: int | None = None
    property_address: str | None = None
    intent: str | None = None
    listing_id_str: str | None = None
    parcel_id: str | None = None
    meta_data: dict[str, Any] | None = None
    updated_at: datetime | None = None


class FakeQuery:
    def __init__(self, rows: list[Any], scalar_value: Any | None = None) -> None:
        self._rows = rows
        self._scalar_value = scalar_value
        self._offset = 0
        self._limit = len(rows)

    def filter(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def order_by(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def join(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def offset(self, value: int) -> "FakeQuery":
        self._offset = max(value, 0)
        return self

    def limit(self, value: int) -> "FakeQuery":
        self._limit = max(value, 0)
        return self

    def all(self) -> list[Any]:
        end = self._offset + self._limit
        return self._rows[self._offset:end]

    def first(self) -> Any | None:
        rows = self.all()
        return rows[0] if rows else None

    def scalar(self) -> Any:
        return self._scalar_value


class FakeSession:
    def __init__(
        self,
        model_rows: dict[Any, list[Any]] | None = None,
        scalar_values: list[Any] | None = None,
    ) -> None:
        self.model_rows = model_rows or {}
        self.scalar_values = scalar_values or []
        self.added: list[Any] = []

    def query(self, entity: Any, *_args: Any, **_kwargs: Any) -> FakeQuery:
        if self.scalar_values:
            return FakeQuery([], scalar_value=self.scalar_values.pop(0))
        return FakeQuery(self.model_rows.get(entity, []))

    def add(self, value: Any) -> None:
        if getattr(value, "id", None) is None:
            value.id = len(self.added) + 1
        self.added.append(value)
        self.model_rows.setdefault(type(value), []).append(value)

    def commit(self) -> None:
        return None

    def refresh(self, _value: Any) -> None:
        return None

    def close(self) -> None:
        return None


def override_db_session(session: FakeSession):
    def _override():
        yield session

    return _override


def override_user(user_type: str):
    def _override():
        return SimpleNamespace(user_type=user_type)

    return _override


@pytest.fixture(autouse=True)
def reset_state(monkeypatch: pytest.MonkeyPatch):
    original_environment = settings.environment
    original_session_local = db_module.SessionLocal
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()
    settings.environment = original_environment
    db_module.SessionLocal = original_session_local


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "SmartMLS AI Platform API"
    assert payload["docs"] == "/docs"


def test_health_check(client: TestClient):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_mls_no_imports_returns_unknown(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(db_module, "SessionLocal", lambda: FakeSession(model_rows={ImportAudit: []}))
    response = client.get("/health/mls")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unknown"
    assert data["last_run"] is None
    assert data["last_successful_run"] is None


def test_health_mls_success_returns_last_run(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    now = datetime.now(timezone.utc)
    audits = [
        FakeImportAudit(
            id=2,
            source="simplyrets",
            run_type="delta",
            status="success",
            started_at=now,
            completed_at=now,
            fetched=10,
            imported=7,
            updated=2,
            matched=1,
        )
    ]
    monkeypatch.setattr(db_module, "SessionLocal", lambda: FakeSession(model_rows={ImportAudit: audits}))
    response = client.get("/health/mls")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["last_run"]["status"] == "success"
    assert data["last_successful_run"]["status"] == "success"


def test_create_lead_accepts_extended_payload(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    session = FakeSession()
    routed: list[Any] = []
    monkeypatch.setattr(LeadRoutingService, "process_new_lead", lambda lead: routed.append(lead))
    app.dependency_overrides[get_db] = override_db_session(session)

    response = client.post(
        "/leads/",
        json={
            "name": "Phase0 User",
            "email": "phase0@example.com",
            "message": "Please contact me",
            "intent": "tour_request",
            "listing_id_str": "MLS-123",
            "parcel_id": "P-123",
            "meta_data": {"browser": "pytest"},
        },
    )
    assert response.status_code == 200
    assert response.json() == {"status": "received"}
    assert len(session.added) == 1
    assert len(routed) == 1
    assert routed[0].intent == "tour_request"
    assert routed[0].meta_data == {"browser": "pytest"}


def test_get_leads_requires_auth(client: TestClient):
    app.dependency_overrides[get_db] = override_db_session(FakeSession(model_rows={Lead: []}))
    response = client.get("/leads/")
    assert response.status_code == 401


def test_get_leads_forbidden_for_non_agent(client: TestClient):
    rows = [
        FakeLead(
            id=101,
            name="Protected Lead",
            email="lead@example.com",
            status="new",
            created_at=datetime.now(timezone.utc),
        )
    ]
    app.dependency_overrides[get_db] = override_db_session(FakeSession(model_rows={Lead: rows}))
    app.dependency_overrides[get_current_user] = override_user("buyer")

    response = client.get("/leads/")
    assert response.status_code == 403


def test_get_leads_allows_agent(client: TestClient):
    rows = [
        FakeLead(
            id=42,
            name="Agent Visible Lead",
            email="agent@example.com",
            status="new",
            created_at=datetime.now(timezone.utc),
        )
    ]
    app.dependency_overrides[get_db] = override_db_session(FakeSession(model_rows={Lead: rows}))
    app.dependency_overrides[get_current_user] = override_user("agent")

    response = client.get("/leads/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 42
    assert data[0]["email"] == "agent@example.com"
