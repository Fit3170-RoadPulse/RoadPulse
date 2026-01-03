# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy app code
COPY app /app

# Expose HTTP port
EXPOSE 8000

# Run migrations then start server
CMD ["sh","-c","python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
