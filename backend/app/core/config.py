from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Video Analytics"
    # Example for SQLite: "sqlite:///./sql_app.db"
    # Example for PostgreSQL: "postgresql://user:password@localhost:5432/dbname"
    DATABASE_URL: str = "sqlite:///./app.db"
    SECRET_KEY: str = "85e6b8f953c696716b4f0bfbbb0d8ad74a623f88e97d5553809be5ac36e7f7be"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()