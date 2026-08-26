from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Video Analytics"
    # Example for SQLite: "sqlite:///./sql_app.db"
    # Example for PostgreSQL: "postgresql://user:password@localhost:5432/dbname"
    DATABASE_URL: str = "sqlite:///./analytics.db"

    class Config:
        env_file = ".env"

settings = Settings()