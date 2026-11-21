from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers import health, plan_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Cuatri API", version="0.1.0", docs_url="/docs")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(plan_router.router)
    return app


app = create_app()
