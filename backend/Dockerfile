FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy application code
COPY app /app

# Expose HTTP port
EXPOSE 8000

# Collect static files, then run migrations and start Gunicorn.
# In local docker-compose (dev), we override this command to use runserver.
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
