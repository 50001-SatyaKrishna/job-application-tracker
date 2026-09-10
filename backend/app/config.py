from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")
    database_hostname: str
    database_port: str
    database_password: str
    database_name: str
    database_username: str
    sqlalchemy_database_url: str
    secret_key: str
    access_token_expire_minutes: int
    algorithm: str

settings = Settings()