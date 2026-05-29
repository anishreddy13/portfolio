from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv


load_dotenv(".env")
load_dotenv(".env.local")
load_dotenv("../.env.local")


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = Field(..., env="NEXT_PUBLIC_SUPABASE_URL", validation_alias="NEXT_PUBLIC_SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="NEXT_PUBLIC_SUPABASE_ANON_KEY", validation_alias="NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY", validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    database_url: str = Field(..., env="DATABASE_URL", validation_alias="DATABASE_URL")

    # APIs
    groq_api_key: str = Field(..., env="GROQ_API_KEY", validation_alias="GROQ_API_KEY")
    rapidapi_key: str = Field(..., env="RAPIDAPI_KEY", validation_alias="RAPIDAPI_KEY")
    github_token: str = Field(..., env="GITHUB_TOKEN", validation_alias="GITHUB_TOKEN")
    huggingface_token: str = Field(..., env="HUGGINGFACE_TOKEN", validation_alias="HUGGINGFACE_TOKEN")
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY", validation_alias="GEMINI_API_KEY")

    # Redis
    upstash_redis_rest_url: str = Field(..., env="UPSTASH_REDIS_REST_URL", validation_alias="UPSTASH_REDIS_REST_URL")
    upstash_redis_rest_token: str = Field(..., env="UPSTASH_REDIS_REST_TOKEN", validation_alias="UPSTASH_REDIS_REST_TOKEN")

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
