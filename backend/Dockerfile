# backend/Dockerfile
FROM python:3.12-slim

# Set working directory to /app
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app folder (including manage.py)
COPY app/ .

# Expose HTTP port
EXPOSE 8000

RUN python manage.py collectstatic --noinput

# Run migrations and start Gunicorn (adjust WSGI path)
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]

