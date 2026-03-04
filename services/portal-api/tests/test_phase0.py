from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from app.models.lead import Lead
from app.models.listing import Listing
from app.services.lead_routing import LeadRoutingService


# Avoid startup table-creation side effects in route tests.
app.router.on_startup.clear()


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


@dataclass
class FakeListing:
    listing_id: int
    listing_id_str: str
    mls_id: int
    address_full: str
    city: str
    state: str
    zip_code: str | None
    status: str
    list_price: Decimal
    original_list_price: Decimal | None
    sold_price: Decimal | None
    sold_date: date | None
    list_date: date
    days_on_market: int | None
    property_type: str | None
    bedrooms: int | None
    bathrooms: Decimal | None
    baths_full: int | None
    baths_half: int | None
    square_feet: int | None
    lot_size: str | None
    acres: Decimal | None
    year_built: int | None
    stories: int | None
    garage_spaces: Decimal | None
    style: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    photos: list[str]
    virtual_tour_url: str | None
    public_remarks: str | None
    tax_annual_amount: Decimal | None
    modified: datetime
    parcel_id: str | None = None
    listing_agent_id: str | None = None
    listing_office_id: str | None = None
    private_remarks: str | None = None
    showing_instructions: str | None = None


class FakeQuery:
    def __init__(self, rows: list[Any], scalar_value: Any | None = None) -> None:
        self._rows = rows
        self._scalar_value = scalar_value

    def filter(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def order_by(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def join(self, *_args: Any, **_kwargs: Any) -> "FakeQuery":
        return self

    def first(self) -> Any | None:
        return self._rows[0] if self._rows else None

    def all(self) -> list[Any]:
        return self._rows

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


@pytest.fixture(autouse=True)
def reset_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_public_listing_endpoint_excludes_private_fields(client: TestClient):
    listing = FakeListing(
        listing_id=999999,
        listing_id_str="TEST-999",
        mls_id=999999,
        address_full="123 Test St",
        city="Fairfield",
        state="CT",
        zip_code="06824",
        status="Active",
        list_price=Decimal("500000.00"),
        original_list_price=None,
        sold_price=None,
        sold_date=None,
        list_date=date(2026, 1, 1),
        days_on_market=5,
        property_type="Single Family",
        bedrooms=3,
        bathrooms=Decimal("2.0"),
        baths_full=2,
        baths_half=0,
        square_feet=2200,
        lot_size="0.25 acres",
        acres=Decimal("0.25"),
        year_built=1999,
        stories=2,
        garage_spaces=Decimal("2"),
        style="Colonial",
        latitude=Decimal("41.12345"),
        longitude=Decimal("-73.12345"),
        photos=["https://example.com/photo.jpg"],
        virtual_tour_url=None,
        public_remarks="Great home",
        tax_annual_amount=Decimal("8500.00"),
        modified=datetime.now(timezone.utc),
        private_remarks="Do not expose",
        showing_instructions="Call first",
    )
    app.dependency_overrides[get_db] = override_db_session(
        FakeSession(model_rows={Listing: [listing]})
    )

    response = client.get("/listings/999999")
    assert response.status_code == 200
    payload = response.json()
    assert payload["address_full"] == "123 Test St"
    assert payload["list_price"] == 500000.0
    assert "private_remarks" not in payload
    assert "showing_instructions" not in payload


def test_city_slug_endpoint_not_found_returns_404(client: TestClient):
    # get_city_by_slug performs two scalar queries: property_count, listing_count.
    app.dependency_overrides[get_db] = override_db_session(FakeSession(scalar_values=[0, 0]))

    response = client.get("/api/cities/not-a-real-city")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_city_slug_endpoint_success_shape(client: TestClient):
    app.dependency_overrides[get_db] = override_db_session(FakeSession(scalar_values=[12, 4]))

    response = client.get("/api/cities/fairfield")
    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Fairfield"
    assert payload["property_count"] == 12
    assert payload["active_listing_count"] == 4


def test_phase0_lead_submission_accepts_extended_metadata(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    session = FakeSession(model_rows={Lead: []})
    routed: list[Any] = []
    monkeypatch.setattr(LeadRoutingService, "process_new_lead", lambda lead: routed.append(lead))
    app.dependency_overrides[get_db] = override_db_session(session)

    response = client.post(
        "/leads/",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Testing phase 0",
            "intent": "tour_request",
            "listing_id_str": "TEST-123",
            "parcel_id": "P-123",
            "meta_data": {"browser": "test-client"},
        },
    )
    assert response.status_code == 200
    assert response.json() == {"status": "received"}
    assert len(session.added) == 1
    assert len(routed) == 1
    assert routed[0].intent == "tour_request"
    assert routed[0].listing_id_str == "TEST-123"
    assert routed[0].meta_data == {"browser": "test-client"}
