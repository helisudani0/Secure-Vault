# Production Deployment Guide

This guide covers deploying Secure Vault to production with proper security, scalability, and reliability.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+ (optional but recommended)
- Docker & Docker Compose (for containerized deployment)
- SSL certificate (Let's Encrypt recommended)

---

## 🐳 Docker Deployment (Recommended)

### 1. Prepare Docker Files

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
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

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./secure-vault-backend
      dockerfile: Dockerfile
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4"
    environment:
      DEBUG: "False"
      ALLOWED_HOSTS: ${ALLOWED_HOSTS}
      SECRET_KEY: ${SECRET_KEY}
      DATABASE_URL: postgresql://vault_user:${DB_PASSWORD}@db:5432/secure_vault
      REDIS_URL: redis://redis:6379/0
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    volumes:
      - ./secure-vault-backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/auth/login/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./secure-vault-frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: ${VITE_API_URL}
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - static_volume:/app/staticfiles:ro
      - media_volume:/app/media:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 2. Create Backend Dockerfile

Create `secure-vault-backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gunicorn psycopg2-binary redis

COPY . .

RUN python manage.py collectstatic --noinput --clear

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### 3. Create Frontend Dockerfile

Create `secure-vault-frontend/Dockerfile`:

```dockerfile
FROM node:16-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

FROM node:16-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

### 4. Create Nginx Configuration

Create `nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name _;
        client_max_body_size 100M;

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;
        client_max_body_size 100M;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
            proxy_connect_timeout 10s;
        }

        # Static files
        location /static/ {
            alias /app/staticfiles/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files
        location /media/ {
            alias /app/media/;
            expires 7d;
            add_header Cache-Control "public";
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. Create .env File

Create `.env` in project root:

```bash
# Django
DEBUG=False
SECRET_KEY=your-secret-key-here-minimum-50-characters
ALLOWED_HOSTS=example.com,www.example.com
ENVIRONMENT=production

# Database
DB_PASSWORD=your-secure-db-password

# CORS
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com

# Frontend
VITE_API_URL=https://example.com/api

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Redis (optional)
REDIS_URL=redis://redis:6379/0

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### 6. Deploy with Docker Compose

```bash
# Generate SSL certificate (first time only)
certbot certonly --standalone -d example.com -d www.example.com

# Copy certificates
mkdir -p ssl
cp /etc/letsencrypt/live/example.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/example.com/privkey.pem ssl/key.pem

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

---

## 🖥️ Manual Deployment (VPS/Server)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip \
                    postgresql postgresql-contrib redis-server \
                    nodejs npm nginx certbot python3-certbot-nginx \
                    supervisor git

# Create application user
sudo useradd -m -s /bin/bash vault_user
sudo su - vault_user
```

### 2. Backend Setup

```bash
# Clone repository
git clone https://github.com/your-repo/secure-vault.git
cd secure-vault

# Setup Python venv
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r secure-vault-backend/requirements.txt
pip install gunicorn psycopg2-binary redis

# Create .env file
cp secure-vault-backend/.env.example secure-vault-backend/.env
# Edit .env with production values

# Run migrations
cd secure-vault-backend
python manage.py migrate
python manage.py collectstatic --noinput

# Test
python manage.py runserver 127.0.0.1:8000
```

### 3. Supervisor Configuration

Create `/etc/supervisor/conf.d/secure-vault-backend.conf`:

```ini
[program:secure-vault-backend]
directory=/home/vault_user/secure-vault/secure-vault-backend
command=/home/vault_user/secure-vault/venv/bin/gunicorn \
    config.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 4 \
    --worker-class sync \
    --timeout 60
user=vault_user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/secure-vault-backend.log
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/secure-vault`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    client_max_body_size 100M;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /home/vault_user/secure-vault/secure-vault-backend/staticfiles/;
        expires 30d;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/secure-vault /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate

```bash
sudo certbot certonly --nginx -d example.com -d www.example.com
```

---

## 📊 Monitoring & Maintenance

### Logging

```bash
# Backend logs
tail -f /var/log/supervisor/secure-vault-backend.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR
pg_dump -U vault_user -h localhost secure_vault | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### SSL Renewal

```bash
# Auto-renew with cron
0 0 1 * * certbot renew --quiet
```

### Performance Monitoring

```bash
# Install Prometheus + Grafana
docker run -d --name prometheus -p 9090:9090 prom/prometheus
docker run -d --name grafana -p 3001:3000 grafana/grafana
```

---

## 🔒 Security Checklist

- [ ] Set DEBUG=False
- [ ] Use strong SECRET_KEY
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Setup WAF (e.g., ModSecurity)
- [ ] Regular security audits
- [ ] Database encryption at rest
- [ ] Regular backups
- [ ] Monitor access logs
- [ ] Setup alerts for errors

---

## 🚀 Performance Optimization

1. **Database**
   - Enable connection pooling (PgBouncer)
   - Add indexes on frequently queried columns
   - Regular vacuum and analyze

2. **Caching**
   - Redis for session storage
   - Cache API responses
   - Browser caching headers

3. **Frontend**
   - Minify and bundle assets
   - Lazy load components
   - Image optimization

4. **Backend**
   - Use async tasks (Celery)
   - Optimize database queries
   - Implement pagination

---

## Troubleshooting

**502 Bad Gateway**
- Check backend service: `systemctl status secure-vault-backend`
- Check logs: `tail -f /var/log/supervisor/secure-vault-backend.log`

**CORS Errors**
- Verify CORS_ALLOWED_ORIGINS in .env
- Check Nginx proxy headers

**High Memory Usage**
- Increase worker timeout
- Reduce number of workers
- Enable Redis caching

**Slow File Upload**
- Increase Nginx client_max_body_size
- Check disk I/O
- Verify encryption performance

---

## Support & Updates

For updates: `git pull origin main`
For issues: Check logs and GitHub issues
For security: Follow security advisories from dependencies

