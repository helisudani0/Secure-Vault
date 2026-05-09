# Security Improvements - Phase 1

This document details all security improvements made to Secure Vault.

## Critical Security Issues Fixed

### 1. Exposed SECRET_KEY
**Before**: Hardcoded in `settings.py`
```python
SECRET_KEY = 'django-insecure-i+t+7%b39xr^++(ceeuk6dnwbz0%5vc^38!ba-g24(e(689++++'
```

**After**: Environment variable
```python
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-CHANGE-THIS-IN-PRODUCTION')
```

**Migration**: Copy `.env.example` to `.env.local` and update values

---

### 2. Passwords Stored in localStorage

**Before**: All sensitive data stored on disk
```javascript
localStorage.setItem("login_password", password);
localStorage.setItem("master_password", masterPassword);
```

**After**: Secure in-memory storage only
```javascript
// Create SecureStorage class - stores in memory + sessionStorage
secureStorage.set("master_password", password);  // In-memory only
secureStorage.get("master_password");  // Returns from memory
// Auto-clears on page unload
```

**User Experience**: 
- Dashboard now has "Unlock Vault" modal
- Enter master password once per session
- Vault auto-locks after 1 hour of inactivity

---

### 3. PBKDF2 Iterations Mismatch

**Before**:
- Backend: 390,000 iterations
- Frontend: 200,000 iterations
- Result: Decryption failures for users

**After**: Standardized to 390,000
```javascript
const PBKDF2_ITERATIONS = 390000;  // Must match backend
```

**Migration**: Existing users can still decrypt (backward compatible)

---

### 4. HTTPS Not Enforced

**Before**: No SSL enforcement
```python
SECURE_SSL_REDIRECT = False
```

**After**: Environment-based configuration
```python
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 'yes')
SECURE_HSTS_SECONDS = 31536000  # 1 year
```

**For Production**: Set in `.env`
```
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

---

### 5. CORS Allows All Origins

**Before**:
```python
CORS_ALLOW_ALL_ORIGINS = True
```

**After**: Whitelist specific domains
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
]
# Production: set via environment
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '...').split(',')
```

---

### 6. No Rate Limiting

**Before**: Anyone could brute-force login/signup

**After**: IP-based rate limiting
```python
# auth_app/rate_limit.py
login_limiter = RateLimiter(
    key_prefix="ratelimit:login",
    max_attempts=5,  # Per hour
    window_seconds=3600
)
```

**Endpoints Protected**:
- `/api/auth/login/` - 5 attempts/hour
- `/api/auth/signup/` - 3 attempts/hour
- `/api/files/upload/` - 50 uploads/day

**Response**:
```json
{
  "error": "Too many login attempts. Please try again later.",
  "remaining_attempts": 0
}
```
Status: `429 Too Many Requests`

---

### 7. No Input Validation

**Before**: Direct use of user input

**After**: Comprehensive validation
```python
# auth_app/validators.py
def validate_username(username):
    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters")
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError("Only alphanumeric and underscore allowed")

def validate_master_password_strength(password):
    if len(password) < 12:
        raise ValidationError("Master password must be at least 12 characters")
```

**Validators**:
- Username: 3-30 chars, alphanumeric + underscore
- Login password: 8+ chars
- Master password: 12+ chars (stricter)
- Filename: No path traversal, length limits
- Wrapped key: Valid base64, size limits
- IV: Exactly 12 bytes

---

### 8. Missing Error Handling

**Before**: Exceptions crashed the app
```python
def get_wrapped_key(request, pk):
    file_obj = get_object_or_404(SecureFile, pk=pk)  # Can crash
    wrapped_key = file_obj.aes_key_owner_wrapped
    return Response({'wrapped_key': wrapped_key})
```

**After**: Comprehensive try-catch and logging
```python
def get_wrapped_key(request, pk):
    try:
        file_obj = get_object_or_404(SecureFile, pk=pk)
        # ...
        logger.info(f"Wrapped key retrieved: {pk}")
        return Response({...})
    except Exception as e:
        logger.error(f"Get wrapped key error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to retrieve wrapped key'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

**All Endpoints**:
- ✅ File upload/download
- ✅ File sharing
- ✅ Authentication
- ✅ Profile access

---

### 9. File Download API Broken for Shared Files

**Before**: Wrapped key accessed separately (2 requests)
```javascript
// Request 1: Get wrapped key
const response = await fetch(`/api/files/wrapped-key/${fileId}/`);

// Request 2: Download file (but wrapped key not included!)
const file = await fetch(`/api/files/download/${fileId}/`);
```

**After**: Wrapped key in response headers (1 request)
```python
def get(self, request, pk):
    # ...
    response = FileResponse(file_obj.file.open('rb'))
    response['X-WRAPPED-KEY'] = wrapped_key  # In headers!
    response['X-IV'] = file_obj.iv
    return response
```

**Frontend**: Reads headers automatically
```javascript
const wrappedKey = response.headers.get("X-WRAPPED-KEY");
const iv = response.headers.get("X-IV");
```

---

### 10. No Token Refresh Endpoint

**Before**: Expired tokens couldn't be refreshed (forced re-login)

**After**: Token refresh endpoint
```python
# auth_app/views.py
class TokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.data.get('refresh')
        refresh = RefreshToken(refresh_token)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })
```

**Endpoint**: `POST /api/token/refresh/`
```json
Request:  {"refresh": "eyJ0eXAi..."}
Response: {"access": "eyJ0eXAi...", "refresh": "eyJ0eXAi..."}
```

---

## Infrastructure Improvements

### Database Indexing
Created migration with 6 new indexes for faster queries:

**SecureFile**:
- `owner` - Fast user file lookups
- `uploaded_at` - Fast sorting
- `owner + uploaded_at` - Composite for common query

**WrappedKey**:
- `recipient` - Fast shared file lookups
- `file + recipient` - Composite for sharing
- `created_at` - Activity timeline sorting

### Configuration Management

**Development (.env.local)**:
- DEBUG=True
- SQLite database
- CORS allows localhost
- Rate limiting disabled
- Email to console

**Production (.env)**:
- DEBUG=False
- PostgreSQL database
- CORS restricted
- Rate limiting enabled
- Email via SMTP

### Logging Configuration

All actions logged to `logs/django.log`:
```
INFO auth.views File upload: 550e8400-e29b-41d4-a716-446655440000 by user john
WARNING auth.rate_limit Too many login attempts from 192.168.1.1
ERROR files.views File share error: Recipient has no public key
```

Log rotation: 10MB files, keeps 5 backups

---

## Migration Guide

### For Development

```bash
# 1. Copy environment template
cp secure-vault-backend/.env.example secure-vault-backend/.env.local

# 2. Install new dependencies (if updated requirements.txt)
pip install -r secure-vault-backend/requirements.txt

# 3. Run migrations (may already be applied)
cd secure-vault-backend
python manage.py migrate

# 4. Test the app
python manage.py runserver
```

### For Production

1. Follow [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
2. Key steps:
   - Set up PostgreSQL
   - Create `.env` with secure values
   - Run migrations
   - Configure Nginx
   - Install SSL certificate
   - Setup backups

---

## Testing the Fixes

### Test Rate Limiting
```bash
# Try 6 login attempts in quick succession
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -d '{"username":"test","password":"wrong"}' \
    -H "Content-Type: application/json"
done
# Should return 429 on 6th attempt
```

### Test Input Validation
```bash
# Try invalid username (too short)
curl -X POST http://localhost:8000/api/auth/signup/ \
  -d '{"username":"ab","password":"password123","master_password":"masterPassword123"}' \
  -H "Content-Type: application/json"
# Should return 400 with validation error
```

### Test Token Refresh
```bash
# Get refresh token from login
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -d '{"username":"testuser","password":"password"}' \
  -H "Content-Type: application/json")

REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refresh')

# Use refresh token
curl -X POST http://localhost:8000/api/token/refresh/ \
  -d "{\"refresh\":\"$REFRESH_TOKEN\"}" \
  -H "Content-Type: application/json"
# Should return new access token
```

### Test Vault Unlock
1. Log in to frontend
2. Navigate to dashboard
3. Should see "Unlock Your Vault" modal
4. Enter master password
5. Vault unlocks and files load

---

## Remaining Security TODOs (Phase 2+)

- [ ] Email verification for signup
- [ ] 2FA/MFA support
- [ ] Password reset flow
- [ ] Session management (logout all devices)
- [ ] File access audit logging
- [ ] Soft delete for files (trash bin)
- [ ] File sharing expiration dates
- [ ] Account deactivation
- [ ] Privacy policy & terms
- [ ] GDPR data export
- [ ] Security headers (CSP, etc.)

---

## Security Best Practices Going Forward

1. **Never store passwords** - Use environment variables
2. **Never log sensitive data** - Filter before logging
3. **Validate all inputs** - Both frontend & backend
4. **Handle all errors** - Return safe error messages
5. **Use HTTPS always** - In production
6. **Rate limit everything** - Auth endpoints especially
7. **Keep dependencies updated** - Run `pip check` & `npm audit`
8. **Regular backups** - Automate and test restores
9. **Monitor logs** - Set up alerts
10. **Security audit** - Quarterly reviews

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/4.2/topics/security/)
- [NIST Guidelines](https://csrc.nist.gov/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Last Updated**: May 8, 2026
**Phase**: 1 (Foundation & Security)
**Status**: Complete ✅
