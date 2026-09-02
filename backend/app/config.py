import os
from urllib.parse import urlparse, unquote
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App Settings
    app_name: str = "CareerMail API"
    app_env: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = False
    
    # Server & Ports
    host: str = "0.0.0.0"
    port: int = 8080
    
    # Database Settings
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: str = Field(default="5432", alias="DB_PORT")
    db_name: str = Field(default="careermail", alias="DB_NAME")
    db_user: str = Field(default="careermail", alias="DB_USER")
    db_password: str = Field(default="careermail123", alias="DB_PASSWORD")
    
    # Security / JWT
    jwt_secret: str = Field(
        default="404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        alias="JWT_SECRET"
    )
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: float = 24.0
    
    # CORS
    cors_allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://localhost,http://127.0.0.1:5173",
        alias="CORS_ALLOWED_ORIGINS"
    )
    
    # Google OAuth
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        default="http://localhost:8080/api/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI"
    )
    frontend_url: str = Field(
        default="http://localhost:5173",
        alias="FRONTEND_URL"
    )
    
    # Gemini AI API Key
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")

    model_config = {
        "env_file": [".env", "../.env"],
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    def get_sqlalchemy_database_url(self) -> str:
        """
        Parses connection strings from various cloud providers (Render, Supabase, Neon, Docker)
        and returns a standard SQLAlchemy URI.
        """
        raw = self.database_url or os.getenv("POSTGRES_URL") or os.getenv("SPRING_DATASOURCE_URL")
        
        if not raw:
            # Construct from individual DB_* environment variables
            user = self.db_user or "careermail"
            pwd = self.db_password or "careermail123"
            host = self.db_host or "localhost"
            port = self.db_port or "5432"
            db = self.db_name or "careermail"
            return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
        
        raw = raw.strip()
        if raw.startswith("jdbc:postgresql://"):
            raw = raw[len("jdbc:"):]
            
        if raw.startswith("postgres://"):
            raw = "postgresql://" + raw[len("postgres://"):]
            
        # If already postgresql:// or sqlite://
        if raw.startswith("postgresql://") or raw.startswith("sqlite://"):
            return raw
            
        # Parse Host=...;Port=... format if passed
        if "Host=" in raw or "host=" in raw:
            parts = {}
            for segment in raw.split(";"):
                if "=" in segment:
                    k, v = segment.split("=", 1)
                    parts[k.strip().lower()] = v.strip()
            host = parts.get("host", self.db_host)
            port = parts.get("port", self.db_port)
            db = parts.get("database", self.db_name)
            user = parts.get("username", parts.get("user", self.db_user))
            pwd = parts.get("password", self.db_password)
            return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
            
        return raw

    def get_cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]
        return origins


settings = Settings()
