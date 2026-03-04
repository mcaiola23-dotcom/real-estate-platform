from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.core.config import settings
from app.db import get_db
from app.main import app
from app.models.listing import Listing
from app.models.user import UserFavorite
from app.services.lead_routing import LeadRoutingService


# Avoid startup table-creation side effects in smoke tests.
app.router.on_startup.clear()


@dataclass
class FakeLead:
    id: int
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
    updated_at: datetime | None = None


class FakeQuery:
    def __init__(self, rows: list[Any]) -> None:
        self._rows = rows

    def filter(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def order_by(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def offset(self, _skip: int) -> "FakeQuery":
        return self

    def limit(self, _limit: int) -> "FakeQuery":
        return self

    def all(self) -> list[FakeLead]:
        return self._rows

    def first(self) -> FakeLead | None:
        return self._rows[0] if self._rows else None

    def count(self) -> int:
        return len(self._rows)


class FakeSession:
    def __init__(
        self,
        rows: list[Any] | None = None,
        model_rows: dict[Any, list[Any]] | None = None,
    ) -> None:
        self._rows = rows or []
        self._model_rows = model_rows or {}
        self.added: list[Any] = []

    def query(self, model: Any) -> FakeQuery:
        return FakeQuery(self._model_rows.get(model, self._rows))

    def add(self, value: Any) -> None:
        self.added.append(value)

    def commit(self) -> None:
        return None

    def refresh(self, value: Any) -> None:
        if hasattr(value, "id") and getattr(value, "id", None) in (None, 0):
            setattr(value, "id", 1000 + len(self.added))
        if hasattr(value, "favorite_id") and getattr(value, "favorite_id", None) in (None, 0):
            setattr(value, "favorite_id", 2000 + len(self.added))
        if hasattr(value, "created_at") and getattr(value, "created_at", None) is None:
            setattr(value, "created_at", datetime.now(timezone.utc))
        return None


def override_db(rows: list[FakeLead] | None = None):
    def _override():
        yield FakeSession(rows)

    return _override


def override_db_session(session: FakeSession):
    def _override():
        yield session

    return _override


def override_user(user_type: str, user_id: int = 1):
    def _override():
        return SimpleNamespace(user_type=user_type, user_id=user_id)

    return _override


def capture_routing_calls(calls: list[Any]):
    def _capture(lead: Any) -> None:
        calls.append(lead)

    return _capture


@pytest.fixture(autouse=True)
def reset_overrides():
    original_environment = settings.environment
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()
    settings.environment = original_environment


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health_endpoint_ok(client: TestClient):
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_test_sentry_blocked_outside_local(client: TestClient):
    settings.environment = "production"
    response = client.get("/test-sentry")
    assert response.status_code == 404
    assert response.json()["detail"] == "Not found"


def test_leads_list_requires_auth(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])
    response = client.get("/leads/")
    assert response.status_code == 401


def test_leads_list_forbidden_for_non_agent_user(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])
    app.dependency_overrides[get_current_user] = override_user("buyer")

    response = client.get("/leads/")
    assert response.status_code == 403
    assert "admin or agent" in response.json()["detail"]


def test_leads_list_allows_admin_user(client: TestClient):
    rows = [
        FakeLead(
            id=101,
            name="Casey Agent Lead",
            email="lead@example.com",
            status="new",
            created_at=datetime.now(timezone.utc),
        )
    ]
    app.dependency_overrides[get_db] = override_db(rows)
    app.dependency_overrides[get_current_user] = override_user("admin")

    response = client.get("/leads/?skip=0&limit=100")
    assert response.status_code == 200

    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) == 1
    assert payload[0]["id"] == 101
    assert payload[0]["email"] == "lead@example.com"


def test_lead_create_public_submission_succeeds(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    session = FakeSession()
    routing_calls: list[Any] = []
    monkeypatch.setattr(LeadRoutingService, "process_new_lead", capture_routing_calls(routing_calls))
    app.dependency_overrides[get_db] = override_db_session(session)

    response = client.post(
        "/leads/",
        json={
            "name": "Smoke Lead",
            "email": "smoke@example.com",
            "message": "Please contact me",
            "intent": "tour_request",
        },
    )
    assert response.status_code == 200
    assert response.json() == {"status": "received"}
    assert len(session.added) == 1
    assert len(routing_calls) == 1
    assert routing_calls[0].email == "smoke@example.com"


def test_lead_create_invalid_email_returns_422(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    session = FakeSession()
    monkeypatch.setattr(LeadRoutingService, "process_new_lead", capture_routing_calls([]))
    app.dependency_overrides[get_db] = override_db_session(session)

    response = client.post(
        "/leads/",
        json={
            "name": "Bad Email Lead",
            "email": "not-an-email",
            "message": "Broken payload",
        },
    )
    assert response.status_code == 422


def test_lead_detail_forbidden_for_non_agent_user(client: TestClient):
    rows = [
        FakeLead(
            id=202,
            name="Private Lead",
            email="private@example.com",
            status="new",
            created_at=datetime.now(timezone.utc),
        )
    ]
    app.dependency_overrides[get_db] = override_db(rows)
    app.dependency_overrides[get_current_user] = override_user("buyer")

    response = client.get("/leads/202")
    assert response.status_code == 403
    assert "admin or agent" in response.json()["detail"]


def test_lead_detail_not_found_for_admin_user(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])
    app.dependency_overrides[get_current_user] = override_user("admin")

    response = client.get("/leads/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Lead not found"


def test_favorites_write_requires_auth(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])

    response = client.post("/api/favorites", json={"listing_id": 123})
    assert response.status_code == 401


def test_saved_searches_write_requires_auth(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])

    response = client.post(
        "/api/saved-searches",
        json={"name": "Auth Required Search", "filters": {"city": "Fairfield"}},
    )
    assert response.status_code == 401


def test_alerts_write_requires_auth(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])

    response = client.post("/api/alerts", json={"saved_search_id": 1, "frequency": "daily"})
    assert response.status_code == 401


def test_favorites_write_validation_missing_property_identifier(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])
    app.dependency_overrides[get_current_user] = override_user("buyer", user_id=7)

    response = client.post("/api/favorites", json={})
    assert response.status_code == 400
    assert "listing_id or parcel_id" in response.json()["detail"]


def test_alerts_write_validation_rejects_invalid_frequency(client: TestClient):
    app.dependency_overrides[get_db] = override_db([])
    app.dependency_overrides[get_current_user] = override_user("buyer", user_id=7)

    response = client.post("/api/alerts", json={"saved_search_id": 11, "frequency": "hourly"})
    assert response.status_code == 400
    assert "Invalid frequency" in response.json()["detail"]


def test_saved_searches_write_enforces_maximum_limit(client: TestClient):
    existing_searches = [SimpleNamespace(id=index + 1, user_id=9) for index in range(10)]
    app.dependency_overrides[get_db] = override_db(existing_searches)
    app.dependency_overrides[get_current_user] = override_user("buyer", user_id=9)

    response = client.post(
        "/api/saved-searches",
        json={"name": "Overflow Search", "filters": {"city": "Westport"}},
    )
    assert response.status_code == 400
    assert "Maximum of 10 saved searches allowed" in response.json()["detail"]


def test_saved_searches_write_succeeds_for_authenticated_user(client: TestClient):
    session = FakeSession([])
    app.dependency_overrides[get_db] = override_db_session(session)
    app.dependency_overrides[get_current_user] = override_user("buyer", user_id=12)

    response = client.post(
        "/api/saved-searches",
        json={
            "name": "Starter Search",
            "filters": {"city": "Fairfield", "max_price": 900000},
            "ai_query": "Homes under 900k in Fairfield",
        },
    )
    assert response.status_code == 201

    payload = response.json()
    assert payload["name"] == "Starter Search"
    assert payload["filters"]["city"] == "Fairfield"
    assert payload["ai_query"] == "Homes under 900k in Fairfield"
    assert len(session.added) == 1
    assert session.added[0].user_id == 12


def test_favorites_write_succeeds_for_authenticated_user(client: TestClient):
    session = FakeSession(
        model_rows={
            UserFavorite: [],
            Listing: [SimpleNamespace(listing_id=321)],
        }
    )
    app.dependency_overrides[get_db] = override_db_session(session)
    app.dependency_overrides[get_current_user] = override_user("buyer", user_id=15)

    response = client.post("/api/favorites", json={"listing_id": 321})
    assert response.status_code == 201

    payload = response.json()
    assert payload["listing_id"] == 321
    assert payload["favorite_id"] >= 2001
    assert len(session.added) == 1
    assert session.added[0].user_id == 15
    assert session.added[0].listing_id == 321
