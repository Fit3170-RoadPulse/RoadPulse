# Base image: Debian Postgres 16 (multi-arch)
FROM postgres:16

# Install dependencies for PostGIS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgis postgresql-16-postgis-3 \
    postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

# Set default command (already in postgres image)
CMD ["postgres"]
