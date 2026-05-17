FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic httpx redis

COPY apps /app/apps
COPY packages /app/packages

ENV PYTHONPATH=/app:/app/packages/platform_contracts/python:/app/packages/platform_observability/python:/app/packages/platform_messaging/python
ARG SERVICE_MODULE=apps.api_gateway.app.main:app
ENV SERVICE_MODULE=${SERVICE_MODULE}

CMD ["sh", "-c", "uvicorn ${SERVICE_MODULE} --host 0.0.0.0 --port 8080"]
