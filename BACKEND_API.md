# Secure Vault - Production Backend Documentation

## Architecture Overview

Secure Vault is an encrypted file storage platform with the following components:

- **Backend**: Django REST Framework with end-to-end encryption
- **Frontend**: React with WebCrypto for client-side encryption/decryption  
- **Database**: PostgreSQL (production) / SQLite (development)
- **Security**: RSA-4096 for key exchange, AES-256-GCM for file encryption

## API Reference

### Authentication Endpoints

All endpoints below require proper request headers:
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  # For authenticated endpoints
```

#### 1. User Registration
```
POST /api/auth/signup/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!",
  "email": "john@example.com",
  "public_key": "-----BEGIN RSA PUBLIC KEY-----...",
  "encrypted_private_key": {
    "version": "1.0.0",
    "ciphertext": "...",
    "salt": "..."
  }
}

Response 201:
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "public_key": "-----BEGIN RSA PUBLIC KEY-----...",
    "encrypted_private_key": {...}
  },
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 2. User Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123!"
}

Response 200:
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "public_key": "-----BEGIN RSA PUBLIC KEY-----...",
    "encrypted_private_key": {...}
  },
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}

Response 429 (Rate Limited):
{
  "error": "Too many login attempts. Please try again later.",
  "remaining_attempts": 2
}
```

#### 3. Token Refresh
```
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}

Response 200:
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Get Profile
```
GET /api/auth/me/
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "email_verified": true,
  "first_name": "John",
  "last_name": "Doe",
  "storage_used_bytes": 1024000,
  "max_storage_bytes": 1099511627776
}
```

#### 5. Update Profile
```
PUT /api/auth/profile/update/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "first_name": "Jane",
  "last_name": "Smith"
}

Response 200:
{
  "detail": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "newemail@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "email_verified": false
  }
}
```

#### 6. Get Storage Usage
```
GET /api/auth/storage-usage/
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "storage_used_bytes": 1024000,
  "max_storage_bytes": 1099511627776,
  "usage_percent": 0.0933,
  "can_upload": true
}
```

### File Endpoints

#### 1. Upload File
```
POST /api/files/upload/
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: <binary_file_data>
aes_key_owner_wrapped: "base64_encoded_wrapped_key"
iv: "base64_encoded_iv"

Response 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "original_name": "document.pdf",
  "size": 2048000,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "owner": {
    "id": 1,
    "username": "john_doe"
  },
  "is_shared": false,
  "download_count": 0
}
```

#### 2. List Files
```
GET /api/files/list/?page=1&page_size=20
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "count": 42,
  "next": "http://api.example.com/api/files/list/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "original_name": "document.pdf",
      "size": 2048000,
      "uploaded_at": "2024-01-15T10:30:00Z",
      "owner": "john_doe",
      "is_owner": true,
      "is_shared": true,
      "download_count": 5
    }
  ]
}
```

#### 3. Download File
```
GET /api/files/download/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <JWT_TOKEN>

Response 200:
Content-Type: application/octet-stream
X-WRAPPED-KEY: base64_encoded_wrapped_key
X-IV: base64_encoded_iv

<encrypted_file_bytes>
```

#### 4. Share File
```
POST /api/files/share/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "recipient_username": "jane_doe",
  "wrapped_key": "base64_encoded_wrapped_key_for_recipient"
}

Response 200:
{
  "detail": "File shared successfully",
  "shared_with": "jane_doe"
}
```

#### 5. Delete File (Soft Delete)
```
DELETE /api/files/delete/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "detail": "File deleted successfully"
}
```

#### 6. Restore File
```
POST /api/files/restore/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "detail": "File restored successfully"
}
```

#### 7. List Trash
```
GET /api/files/trash/
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "original_name": "old_document.pdf",
      "size": 1024000,
      "deleted_at": "2024-01-14T15:20:00Z"
    }
  ]
}
```

## Environment Configuration

Copy `.env.example` to `.env.local` and customize:

```bash
# Django settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,example.com
DEBUG_PROPAGATE_EXCEPTIONS=False

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/secure_vault

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Logging
LOG_LEVEL=INFO
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of what went wrong",
  "details": {
    "field_name": ["Error message for this field"]
  }
}
```

### Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Access denied (not the file owner)
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Login**: 5 attempts per hour per IP
- **Signup**: 3 attempts per hour per IP
- **File Upload**: 50 files per day per user (future)
- **File Download**: Configurable per file (future)

## Security Features

- **Encryption**: AES-256-GCM for files, RSA-4096 for key exchange
- **Authentication**: JWT with refresh tokens
- **Password Hashing**: PBKDF2 with 390,000 iterations
- **Input Validation**: All inputs validated and sanitized
- **CORS Protection**: Whitelist-based CORS configuration
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Rate Limiting**: Per-IP rate limiting on auth endpoints
- **Access Control**: Users can only access their own files
- **Audit Logging**: All file operations logged with user and timestamp
- **Soft Delete**: Files can be recovered from trash for 30 days
- **File Expiration**: Optional automatic deletion after specified date

## Database Schema

### User Model (CustomUser)
- `id`: Primary key
- `username`: Unique, 3-150 characters
- `email`: Unique email address
- `password`: Hashed password (PBKDF2)
- `public_key`: RSA-4096 public key
- `encrypted_private_key`: Encrypted private key (JSON)
- `email_verified`: Boolean flag
- `two_factor_enabled`: Boolean flag
- `storage_used_bytes`: Current storage usage
- `max_storage_bytes`: Maximum allowed storage (1TB default)
- `account_locked`: Boolean flag
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### File Model (SecureFile)
- `id`: UUID primary key
- `owner`: Foreign key to CustomUser
- `file`: File field with encrypted content
- `original_name`: Filename
- `size`: File size in bytes
- `aes_key_owner_wrapped`: AES key wrapped with owner's public key
- `iv`: Initialization vector for AES-GCM
- `uploaded_at`: Upload timestamp
- `is_deleted`: Soft delete flag
- `deleted_at`: Deletion timestamp
- `expires_at`: Optional expiration timestamp
- `download_limit`: Optional download limit
- `download_count`: Current download count

### Key Share Model (WrappedKey)
- `id`: Primary key
- `file`: Foreign key to SecureFile
- `recipient`: Foreign key to CustomUser
- `wrapped_key`: AES key wrapped with recipient's public key
- `created_at`: Share creation timestamp
- `can_reshare`: Whether recipient can re-share
- `expires_at`: Optional share expiration

### Access Log Model (FileAccessLog)
- `id`: UUID primary key
- `file`: Foreign key to SecureFile
- `action`: Action type (upload, download, share, delete, etc.)
- `by_user`: User who performed action
- `ip_address`: IP address of request
- `timestamp`: When action occurred
- `details`: JSON details of action

## Testing

Run tests:
```bash
python manage.py test
```

Run with coverage:
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## Deployment

See `PRODUCTION_DEPLOYMENT.md` for:
- PostgreSQL migration guide
- Docker setup
- Nginx reverse proxy configuration
- SSL/TLS setup
- Backup strategy
- Health checks
- Monitoring

## Future Enhancements

- [ ] Email verification workflow
- [ ] Password reset via email
- [ ] Two-factor authentication (TOTP)
- [ ] File versioning
- [ ] Collaborative folders
- [ ] Advanced search
- [ ] Mobile app
- [ ] API webhooks
- [ ] S3/cloud storage backend
- [ ] File preview service
