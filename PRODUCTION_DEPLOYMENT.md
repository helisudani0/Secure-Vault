# PRODUCTION_DEPLOYMENT.md

# Secure Vault - Production Deployment Guide

## Prerequisites

- PostgreSQL 13+ installed and running
- Python 3.9+
- Node.js 18+
- Linux server (Ubuntu 20.04+ recommended)

## Phase 1: Database Migration (SQLite → PostgreSQL)

### Step 1: Backup Existing SQLite Database

```bash
cd secure-vault-backend
cp db.sqlite3 db.sqlite3.backup
```

### Step 2: Install PostgreSQL Client

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

### Step 3: Create PostgreSQL Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE secure_vault;

# Create user with password
CREATE USER vault_user WITH PASSWORD 'strong-password-here';

# Grant permissions
ALTER ROLE vault_user SET client_encoding TO 'utf8';
ALTER ROLE vault_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE vault_user SET default_transaction_deferrable TO on;
ALTER ROLE vault_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE secure_vault TO vault_user;

# Exit psql
\q
```

### Step 4: Setup Django for PostgreSQL

```bash
# Install psycopg2 (PostgreSQL adapter)
pip install psycopg2-binary

# Update .env for PostgreSQL
cat > .env.production << EOF
DEBUG=False
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=secure_vault
DB_USER=vault_user
DB_PASSWORD=your-strong-password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EOF
```

### Step 5: Run Migrations on PostgreSQL

```bash
# Load the new environment
source .env.production

# Run migrations (creates schema)
python manage.py migrate --no-input

# Verify (should see "postgres" in output)
python manage.py dbshell
# Type: \dt (lists tables)
# Type: \q (exit)
```

### Step 6: Data Migration (Optional - if you have existing data)

```bash
# Export data from SQLite
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data.json

# Import data to PostgreSQL
python manage.py loaddata data.json
```

### Step 7: Verify Schema

```bash
python manage.py dbshell
```

PostgreSQL commands:
```sql
\dt                    -- List all tables
\di                    -- List all indexes
SELECT * FROM auth_app_customuser;  -- View users
SELECT * FROM files_app_securefile; -- View files
\q                     -- Exit
```

## Phase 2: Backend Setup

### Step 1: Install Dependencies

```bash
cd secure-vault-backend
pip install -r requirements.txt
```

### Step 2: Environment Configuration

```bash
# Copy example to production env
cp .env.example .env.production

# Edit with your values
nano .env.production
```

### Step 3: Create Django Admin User

```bash
python manage.py createsuperuser --noinput \
  --username admin \
  --email admin@example.com
# Set password when prompted
```

### Step 4: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### Step 5: Test Server Locally First

```bash
DJANGO_ENV=production python manage.py runserver 0.0.0.0:8000
```

## Phase 3: Frontend Setup

### Step 1: Build Frontend

```bash
cd ../secure-vault-frontend
npm ci  # Install exact dependencies
npm run build  # Creates optimized bundle in dist/
```

### Step 2: Configure API Endpoint

Update `.env` or `vite.config.js` to point to production API:
```
VITE_API_URL=https://api.yourdomain.com
```

## Phase 4: Deployment with Docker

### Step 1: Create Dockerfile (Backend)

```dockerfile
# secure-vault-backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create non-root user
RUN useradd -m -u 1000 vaultuser && chown -R vaultuser:vaultuser /app
USER vaultuser

# Run migrations and start server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "secure_vault_backend.wsgi:application"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: secure_vault
      POSTGRES_USER: vault_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vault_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./secure-vault-backend
      dockerfile: Dockerfile
    environment:
      DEBUG: "False"
      SECRET_KEY: ${SECRET_KEY}
      DB_ENGINE: django.db.backends.postgresql
      DB_NAME: secure_vault
      DB_USER: vault_user
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: postgres
      DB_PORT: 5432
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./secure-vault-backend/media:/app/media
      - ./secure-vault-backend/logs:/app/logs

  frontend:
    build:
      context: ./secure-vault-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://backend:8000

volumes:
  postgres_data:
```

### Step 3: Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python manage.py createsuperuser

# View logs
docker-compose logs -f backend
```

## Phase 5: Nginx Reverse Proxy Setup

Create `/etc/nginx/sites-available/secure-vault`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    # Static files
    location /static {
        alias /var/www/secure-vault/staticfiles;
        expires 30d;
    }

    # Media files
    location /media {
        alias /var/www/secure-vault/media;
        expires 7d;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/secure-vault /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Phase 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

## Phase 7: Monitoring & Logging

### Check Service Status
```bash
# Check if backend is running
curl https://yourdomain.com/api/health/

# Check Django logs
tail -f /var/log/gunicorn/error.log

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### Setup Log Rotation
Create `/etc/logrotate.d/secure-vault`:
```
/var/www/secure-vault/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload gunicorn
    endscript
}
```

## Backup Strategy

### Automated PostgreSQL Backups
```bash
# Create backup script
cat > /usr/local/bin/backup-secure-vault.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/secure-vault"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U vault_user secure_vault | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Media files backup
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/secure-vault/media

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-secure-vault.sh

# Add to crontab for daily 2 AM backups
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-secure-vault.sh
```

## Verification Checklist

- [ ] PostgreSQL database created and accessible
- [ ] Django migrations applied successfully
- [ ] Admin user created
- [ ] Frontend built and deployed
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Environment variables set correctly
- [ ] Logging configured and working
- [ ] Backups automated and tested
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Static files served correctly
- [ ] Media files accessible
- [ ] Email notifications working (if configured)

## Rollback Plan

If something goes wrong:

1. Stop the application:
   ```bash
   docker-compose down
   ```

2. Restore from backup:
   ```bash
   gunzip < /var/backups/secure-vault/db_BACKUP_DATE.sql.gz | psql -U vault_user secure_vault
   ```

3. Restart services:
   ```bash
   docker-compose up -d
   ```

## Performance Tuning

### PostgreSQL Optimization (postgresql.conf)
```
shared_buffers = 256MB           # 25% of RAM
effective_cache_size = 1GB       # 50-75% of RAM
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1           # SSD optimization
```

### Django Optimization
- Enable query caching
- Use connection pooling (pgbouncer)
- Implement Redis for sessions
- Enable gzip compression
- Optimize static file serving

## Monitoring Setup

- Install Prometheus for metrics
- Setup Grafana for visualization
- Configure alerts for CPU, memory, disk usage
- Monitor database connection pool

---

**Questions?** Review the [README.md](../README.md) or check [troubleshooting guide](TROUBLESHOOTING.md).
