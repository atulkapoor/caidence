from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional, List
import warnings

# Default insecure values - used to detect if user hasn't set production secrets
_DEFAULT_SECRET_KEY = "your-super-secret-key-change-in-production-at-least-32-chars"
_DEFAULT_SUPERUSER_PASSWORD = "admin123"

class Settings(BaseSettings):
    PROJECT_NAME: str = "C(AI)DENCE Dashboard API"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment: "development" | "staging" | "production"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = _DEFAULT_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() == "production"
    
    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "cadence_ai"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = None
    
    # Initial Superuser Seeding
    FIRST_SUPERUSER: str = "admin@caidence.ai"
    FIRST_SUPERUSER_PASSWORD: str = _DEFAULT_SUPERUSER_PASSWORD
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = "ollama"
    LLM_MODEL: str = ""  # Empty for auto-detect
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Redis (Job Queue)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Frontend URL (for OAuth redirect after callback)
    FRONTEND_URL: str = "http://localhost:3000"
    # Public backend base URL (used to derive OAuth callback if OAUTH_REDIRECT_BASE is not set)
    BACKEND_PUBLIC_URL: str = "http://localhost:8080"
    OAUTH_REDIRECT_BASE: Optional[str] = None

    # Social OAuth Credentials
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    SNAPCHAT_CLIENT_ID: str = ""
    SNAPCHAT_CLIENT_SECRET: str = ""
    WHATSAPP_APP_ID: str = ""
    WHATSAPP_APP_SECRET: str = ""

    @model_validator(mode='after')
    def validate_security_settings(self):
        """Validate security settings based on environment."""
        if not self.OAUTH_REDIRECT_BASE:
            base = self.BACKEND_PUBLIC_URL.rstrip("/")
            self.OAUTH_REDIRECT_BASE = f"{base}{self.API_V1_STR}/social/callback"

        # Normalize URL formatting (no trailing slash)
        self.OAUTH_REDIRECT_BASE = self.OAUTH_REDIRECT_BASE.rstrip("/")
        self.FRONTEND_URL = self.FRONTEND_URL.rstrip("/")
        self.BACKEND_PUBLIC_URL = self.BACKEND_PUBLIC_URL.rstrip("/")

        if self.is_production:
            # In production, fail fast if using default secrets
            if self.SECRET_KEY == _DEFAULT_SECRET_KEY:
                raise ValueError(
                    "CRITICAL: SECRET_KEY must be set in production! "
                    "Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )
            if self.FIRST_SUPERUSER_PASSWORD == _DEFAULT_SUPERUSER_PASSWORD:
                raise ValueError(
                    "CRITICAL: FIRST_SUPERUSER_PASSWORD must be changed in production!"
                )
        else:
            # In development, warn but don't crash
            if self.SECRET_KEY == _DEFAULT_SECRET_KEY:
                warnings.warn(
                    "⚠️  Using default SECRET_KEY - set via env for production!",
                    UserWarning
                )
            if self.FIRST_SUPERUSER_PASSWORD == _DEFAULT_SUPERUSER_PASSWORD:
                warnings.warn(
                    "⚠️  Using default admin password 'admin123' - change for production!",
                    UserWarning
                )
        return self

    def assemble_db_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            # Auto-fix sync driver scheme for async engine compatibility
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        # Default to SQLite for easier local development if Postgres is not explicitly set in env
        return "sqlite+aiosqlite:///./sql_app.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Ignore extra env vars not defined in this class
    )

settings = Settings()

