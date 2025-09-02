"""
Application Configuration
Simplified configuration management
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Database Configuration
    database_url: str = Field(default="sqlite:///./ecommerce.db", env="DATABASE_URL")
    
    # Security Configuration
    secret_key: str = Field(default="dev-secret-key-change-in-production", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # CORS Configuration
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"], 
        env="ALLOWED_ORIGINS"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
