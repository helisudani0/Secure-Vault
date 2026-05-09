# files_app/api_docs.py
"""
API Documentation and Examples
"""

API_ENDPOINTS = {
    "auth": {
        "signup": {
            "method": "POST",
            "endpoint": "/api/auth/signup/",
            "description": "Create a new user account",
            "request_body": {
                "username": "string (required, 3-30 chars, alphanumeric + _)",
                "password": "string (required, 8+ chars)",
                "password2": "string (required, must match password)",
                "email": "string (optional)",
                "public_key": "string (required, RSA 4096 public key PEM format)",
                "encrypted_private_key": "object (required, encrypted private key)"
            },
            "response": {
                "user": {
                    "id": "integer",
                    "username": "string",
                    "public_key": "string",
                    "encrypted_private_key": "object"
                },
                "access": "string (JWT token)",
                "refresh": "string (refresh token)"
            },
            "status_codes": {
                "201": "User created successfully",
                "400": "Validation error",
                "429": "Too many signup attempts"
            }
        },
        
        "login": {
            "method": "POST",
            "endpoint": "/api/auth/login/",
            "description": "Authenticate and receive JWT tokens",
            "request_body": {
                "username": "string (required)",
                "password": "string (required)"
            },
            "response": {
                "user": {
                    "id": "integer",
                    "username": "string",
                    "public_key": "string",
                    "encrypted_private_key": "object"
                },
                "access": "string (JWT token)",
                "refresh": "string (refresh token)"
            },
            "status_codes": {
                "200": "Login successful",
                "401": "Invalid credentials",
                "429": "Too many login attempts"
            }
        },
        
        "token_refresh": {
            "method": "POST",
            "endpoint": "/api/auth/token/refresh/",
            "description": "Refresh JWT access token",
            "request_body": {
                "refresh": "string (required, refresh token)"
            },
            "response": {
                "access": "string (new JWT token)",
                "refresh": "string (new refresh token)"
            },
            "status_codes": {
                "200": "Token refreshed successfully",
                "401": "Invalid or expired refresh token"
            }
        },
        
        "profile": {
            "method": "GET",
            "endpoint": "/api/auth/me/",
            "description": "Get current user profile (authenticated)",
            "auth": "Bearer token (required)",
            "response": {
                "id": "integer",
                "username": "string",
                "public_key": "string"
            },
            "status_codes": {
                "200": "Success",
                "401": "Unauthorized"
            }
        },
        
        "update_profile": {
            "method": "PUT",
            "endpoint": "/api/auth/profile/update/",
            "description": "Update user profile (authenticated)",
            "auth": "Bearer token (required)",
            "request_body": {
                "email": "string (optional)",
                "first_name": "string (optional)",
                "last_name": "string (optional)"
            },
            "response": {
                "detail": "string",
                "user": {
                    "id": "integer",
                    "username": "string",
                    "email": "string",
                    "first_name": "string",
                    "last_name": "string",
                    "email_verified": "boolean"
                }
            },
            "status_codes": {
                "200": "Profile updated",
                "400": "Validation error",
                "401": "Unauthorized"
            }
        },
        
        "storage_usage": {
            "method": "GET",
            "endpoint": "/api/auth/storage-usage/",
            "description": "Get user storage usage info (authenticated)",
            "auth": "Bearer token (required)",
            "response": {
                "storage_used_bytes": "integer",
                "max_storage_bytes": "integer",
                "usage_percent": "number (0-100)",
                "can_upload": "boolean"
            },
            "status_codes": {
                "200": "Success",
                "401": "Unauthorized"
            }
        },
    },
    
    "files": {
        "upload": {
            "method": "POST",
            "endpoint": "/api/files/upload/",
            "description": "Upload and encrypt a file (authenticated)",
            "auth": "Bearer token (required)",
            "request_body": {
                "file": "file (required)",
                "aes_key_owner_wrapped": "string (required, wrapped AES key)",
                "iv": "string (required, base64-encoded IV)"
            },
            "response": {
                "id": "uuid",
                "original_name": "string",
                "size": "integer (bytes)",
                "uploaded_at": "datetime",
                "owner": {"id": "integer", "username": "string"},
                "is_shared": "boolean"
            },
            "status_codes": {
                "201": "File uploaded successfully",
                "400": "Validation error",
                "401": "Unauthorized"
            }
        },
        
        "list": {
            "method": "GET",
            "endpoint": "/api/files/list/",
            "description": "List user's files (owned + shared)",
            "auth": "Bearer token (required)",
            "query_params": {
                "page": "integer (optional, defaults to 1)",
                "page_size": "integer (optional, defaults to 20)"
            },
            "response": {
                "count": "integer",
                "next": "string (URL)",
                "previous": "string (URL)",
                "results": [
                    {
                        "id": "uuid",
                        "original_name": "string",
                        "size": "integer",
                        "uploaded_at": "datetime",
                        "owner": "string (username)",
                        "is_owner": "boolean",
                        "is_shared": "boolean",
                        "download_count": "integer"
                    }
                ]
            },
            "status_codes": {
                "200": "Success",
                "401": "Unauthorized"
            }
        },
        
        "download": {
            "method": "GET",
            "endpoint": "/api/files/download/{file_id}/",
            "description": "Download encrypted file",
            "auth": "Bearer token (required)",
            "response": {
                "body": "encrypted file bytes",
                "headers": {
                    "X-WRAPPED-KEY": "wrapped AES key",
                    "X-IV": "base64-encoded IV"
                }
            },
            "status_codes": {
                "200": "Success",
                "401": "Unauthorized",
                "403": "Access denied",
                "404": "File not found"
            }
        },
        
        "share": {
            "method": "POST",
            "endpoint": "/api/files/share/{file_id}/",
            "description": "Share file with another user",
            "auth": "Bearer token (required)",
            "request_body": {
                "recipient_username": "string (required)",
                "wrapped_key": "string (required, wrapped AES key for recipient)"
            },
            "response": {
                "detail": "string",
                "shared_with": "string (username)"
            },
            "status_codes": {
                "200": "File shared successfully",
                "400": "Validation error",
                "401": "Unauthorized",
                "404": "File or user not found"
            }
        },
        
        "delete": {
            "method": "DELETE",
            "endpoint": "/api/files/delete/{file_id}/",
            "description": "Soft-delete a file (move to trash)",
            "auth": "Bearer token (required)",
            "response": {
                "detail": "string"
            },
            "status_codes": {
                "200": "File deleted",
                "401": "Unauthorized",
                "404": "File not found"
            }
        },
        
        "trash_list": {
            "method": "GET",
            "endpoint": "/api/files/trash/",
            "description": "List deleted files in trash",
            "auth": "Bearer token (required)",
            "response": {
                "files": [
                    {
                        "id": "uuid",
                        "original_name": "string",
                        "size": "integer",
                        "deleted_at": "datetime"
                    }
                ]
            },
            "status_codes": {
                "200": "Success",
                "401": "Unauthorized"
            }
        },
        
        "restore": {
            "method": "POST",
            "endpoint": "/api/files/restore/{file_id}/",
            "description": "Restore a deleted file from trash",
            "auth": "Bearer token (required)",
            "response": {
                "detail": "string"
            },
            "status_codes": {
                "200": "File restored",
                "401": "Unauthorized",
                "404": "File not found"
            }
        },
    }
}
