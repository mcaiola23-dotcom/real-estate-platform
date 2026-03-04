import re
from pydantic_settings import BaseSettings
from typing import Optional, List, Literal


WEAK_AUTH_SECRETS = {
    "",
    "change-this-secret-key-in-production",
    "changeme",
    "default",
    "secret",
    "test-secret",
    "your-secret-key",
}

WEAK_GOOGLE_MAPS_KEYS = {
    "",
    "your-google-maps-api-key",
    "your_google_maps_api_key",
    "replace-with-real-key",
    "replace_me",
    "changeme",
    "google_maps_api_key",
}
GOOGLE_MAPS_KEY_PATTERN = re.compile(r"^AIza[0-9A-Za-z_-]{20,}$")


class Settings(BaseSettings):
    """Application settings and configuration."""
    
    # Environment
    environment: Literal["local", "staging", "production"] = "local"
    
    # Database
    database_url: str = "postgresql://postgres:user@localhost:5432/smartmls_db"
    
    # API Settings
    api_title: str = "SmartMLS AI Platform"
    api_version: str = "1.0.0"
    api_description: str = "AI-driven real estate platform for Fairfield County, CT"
    
    # SimplyRETS API
    simplyrets_username: str = "simplyrets"
    simplyrets_password: str = "simplyrets"
    simplyrets_base_url: str = "https://api.simplyrets.com"  # Demo data available immediately
    simplyrets_timeout: float = 30.0
    simplyrets_max_retries: int = 3
    simplyrets_retry_delay: float = 1.0
    
    # CORS Settings - includes local, staging, and production origins
    cors_origins: List[str] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8080",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        # Vercel staging/production (update with your actual domains)
        "https://smartmls-ai-app.vercel.app",
        "https://smartmls-staging.vercel.app",
    ]
    
    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100
    
    # Google Maps / Street View
    # `google_maps_api_key` is retained as a legacy fallback.
    google_maps_api_key: Optional[str] = None
    google_maps_server_api_key: Optional[str] = None
    google_places_api_key: Optional[str] = None
    google_require_keys_on_startup: bool = True
    google_validate_key_format: bool = True
    google_places_proxy_enabled: bool = True
    google_street_view_enabled: bool = True
    google_street_view_daily_limit: int = 900
    google_street_view_monthly_limit: int = 25000
    
    # OpenAI API
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"  # Fast, cheap, reliable
    openai_temperature: float = 0.0  # Deterministic for parsing
    openai_max_tokens: int = 1000
    openai_timeout: float = 30.0
    
    # Observability - Sentry
    sentry_dsn: Optional[str] = None
    sentry_environment: str = "development"
    sentry_traces_sample_rate: float = 0.1
    
    # Observability - Logging
    log_level: str = "INFO"
    log_format: str = "text"  # "json" for production, "text" for local
    
    # Redis Caching
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_search: int = 300  # 5 minutes
    cache_ttl_map: int = 180  # 3 minutes
    cache_ttl_detail: int = 600  # 10 minutes
    
    # Authentication
    auth_secret_key: str = "change-this-secret-key-in-production"  # Override via env
    auth_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Background workers
    scheduler_refresh_interval_hours: int = 12
    scheduler_poll_interval_seconds: int = 3600
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"
    
    @property
    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.environment == "staging"

    @staticmethod
    def _normalize_secret(value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @property
    def google_server_api_key(self) -> Optional[str]:
        """Server-side key used for Street View and commute calls."""
        return (
            self._normalize_secret(self.google_maps_server_api_key)
            or self._normalize_secret(self.google_maps_api_key)
        )

    @property
    def google_places_proxy_api_key(self) -> Optional[str]:
        """Server-side key used by the Places proxy endpoints."""
        return (
            self._normalize_secret(self.google_places_api_key)
            or self._normalize_secret(self.google_maps_api_key)
        )

    def _validate_google_maps_settings(self) -> None:
        if not self.google_require_keys_on_startup:
            return

        server_key = self.google_server_api_key
        places_key = self.google_places_proxy_api_key

        if self.google_street_view_enabled and not server_key:
            raise ValueError(
                "Missing Google server key: set GOOGLE_MAPS_SERVER_API_KEY "
                "(preferred) or GOOGLE_MAPS_API_KEY (legacy fallback) when "
                "GOOGLE_STREET_VIEW_ENABLED=true."
            )

        if self.google_places_proxy_enabled and not places_key:
            raise ValueError(
                "Missing Google Places key: set GOOGLE_PLACES_API_KEY "
                "(preferred) or GOOGLE_MAPS_API_KEY (legacy fallback) when "
                "GOOGLE_PLACES_PROXY_ENABLED=true."
            )

        if not self.google_validate_key_format:
            return

        keys_to_check = []
        if server_key:
            server_source = (
                "GOOGLE_MAPS_SERVER_API_KEY"
                if self._normalize_secret(self.google_maps_server_api_key)
                else "GOOGLE_MAPS_API_KEY (legacy fallback)"
            )
            keys_to_check.append((server_source, server_key))

        if places_key:
            places_source = (
                "GOOGLE_PLACES_API_KEY"
                if self._normalize_secret(self.google_places_api_key)
                else "GOOGLE_MAPS_API_KEY (legacy fallback)"
            )
            keys_to_check.append((places_source, places_key))

        # Avoid duplicate checks when both resolved keys are identical.
        seen = set()
        deduped = []
        for source, key in keys_to_check:
            if key in seen:
                continue
            seen.add(key)
            deduped.append((source, key))

        for source, key in deduped:
            if key.lower() in WEAK_GOOGLE_MAPS_KEYS:
                raise ValueError(
                    f"{source} is using a placeholder value. "
                    "Set a real Google API key."
                )
            if not GOOGLE_MAPS_KEY_PATTERN.match(key):
                raise ValueError(
                    f"{source} does not look like a valid Google API key "
                    "(expected a key starting with 'AIza')."
                )

    def validate_runtime_settings(self) -> None:
        """Fail fast on unsafe runtime settings."""
        if self.environment != "local":
            secret = (self.auth_secret_key or "").strip()
            if secret.lower() in WEAK_AUTH_SECRETS:
                raise ValueError(
                    "AUTH_SECRET_KEY must be set to a strong non-placeholder value "
                    "for staging/production environments."
                )

            if len(secret) < 32:
                raise ValueError(
                    "AUTH_SECRET_KEY must be at least 32 characters in staging/production."
                )

        self._validate_google_maps_settings()
    
    class Config:
        env_file = (".env.local", ".env")
        case_sensitive = False


# Global settings instance
settings = Settings()
