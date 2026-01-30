from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "C(AI)DENCE Dashboard API"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-at-least-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "cadence_ai"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = None
    
    # Initial Superuser Seeding
    FIRST_SUPERUSER: str = "admin@caidence.ai"
    FIRST_SUPERUSER_PASSWORD: str = "admin123" # Should be overridden in .env
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = "ollama"
    LLM_MODEL: str = ""  # Empty for auto-detect
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Redis (Job Queue)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

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


