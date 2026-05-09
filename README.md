# Secure Vault — Enterprise-Grade Encrypted File Storage

A **production-ready full-stack secure file storage platform** with end-to-end encryption, modern UI, and comprehensive security features.

## ✨ Features

### Core Functionality
- **End-to-End Encryption** — Files encrypted before upload using AES-256, ensuring complete data privacy
- **User Authentication** — Secure JWT-based authentication with token refresh
- **File Management** — Upload, download, delete, organize, and share files
- **File Sharing** — Securely share encrypted files with other users
- **Access Control** — Owner/recipient-based file access management

### Security
- PBKDF2 key derivation (390,000 iterations)
- RSA asymmetric encryption for key management
- Secure password hashing with bcrypt
- CORS protection and CSRF tokens
- Rate limiting on authentication endpoints
- Encrypted storage of encryption keys
- Master password protection

### User Experience
- **Modern Premium UI** — Glassmorphism design with gradients and animations
- **Responsive Design** — Fully responsive on desktop, tablet, and mobile
- **Dark/Light Mode Support** — Theme switching with persistent storage
- **Real-time Feedback** — Loading states, success/error toasts, skeleton loaders
- **Dashboard** — File grid/list view with search and filtering
- **Settings Hub** — General, security, privacy, and storage settings
- **Profile Management** — User profile, activity timeline, connected devices

### Performance
- Paginated API responses
- Database query optimization with select_related/prefetch_related
- Response compression
- Lazy loading for file lists
- Efficient encryption/decryption with Web Crypto API

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to backend:
```bash
cd secure-vault-backend
```

2. Create and activate Python virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Apply database migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start development server:
```bash
python manage.py runserver
```
Backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd secure-vault-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```
Frontend will be available at `http://localhost:5174` (Vite) or `http://localhost:3000` (fallback)

---

## 📁 Project Structure

```
secure-vault/
├── secure-vault-backend/          # Django REST API
│   ├── auth_app/                  # Authentication (JWT, user management)
│   ├── files_app/                 # File management (upload, download, sharing)
│   ├── shared_folder/             # Shared utilities
│   ├── manage.py
│   └── requirements.txt
│
├── secure-vault-frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Button.jsx         # Button variants
│   │   │   ├── Card.jsx           # Card layouts
│   │   │   ├── FormInputs.jsx     # Form controls
│   │   │   ├── Modal.jsx          # Dialog component
│   │   │   ├── Toast.jsx          # Notifications
│   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   ├── FileUpload.jsx     # Upload handler
│   │   │   └── Skeleton.jsx       # Loading states
│   │   │
│   │   ├── pages/                 # Page components
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Signup.jsx         # Sign up page
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── Profile.jsx        # User profile
│   │   │   ├── Settings.jsx       # Settings hub
│   │   │   └── NotFound.jsx       # 404 page
│   │   │
│   │   ├── context/               # React contexts
│   │   │   ├── AuthContext.jsx    # Authentication state
│   │   │   ├── ThemeContext.jsx   # Theme management
│   │   │   └── ToastContext.jsx   # Notifications
│   │   │
│   │   ├── utils/                 # Utilities
│   │   │   └── crypto.js          # Encryption/decryption
│   │   │
│   │   ├── api/                   # API clients
│   │   │   ├── api.js             # File operations
│   │   │   └── files.js           # File endpoints
│   │   │
│   │   ├── App.jsx                # App routing
│   │   ├── index.css              # Global styles
│   │   └── tailwind.config.js     # Tailwind configuration
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore                      # Git ignore patterns
├── README.md                       # This file
└── DEPLOYMENT.md                   # Deployment guide
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup/` — Register new user
- `POST /api/auth/login/` — Login and receive JWT tokens
- `POST /api/auth/refresh/` — Refresh access token

### Files
- `GET /api/files/` — List user's files
- `POST /api/files/upload/` — Upload encrypted file
- `GET /api/files/{id}/download/` — Download and decrypt file
- `DELETE /api/files/{id}/` — Delete file
- `GET /api/files/shared/` — List files shared with user

### Sharing
- `POST /api/files/{id}/share/` — Share file with user
- `DELETE /api/files/{id}/share/{recipient_id}/` — Revoke sharing

---

## 🎨 Design System

### Colors
- **Primary** — Blue (#3b82f6)
- **Accent** — Cyan (#06b6d4)
- **Success** — Green (#10b981)
- **Warning** — Yellow (#f59e0b)
- **Error** — Red (#ef4444)
- **Background** — Slate (#0f172a, #1e293b)

### Components
- **Buttons** — Primary, secondary, danger, ghost variants
- **Cards** — Glassmorphism with backdrop blur
- **Forms** — Validated inputs with error states
- **Modals** — Flexible dialog with actions
- **Toasts** — Stack of notifications with auto-dismiss
- **Skeletons** — Loading placeholders for better UX

### Animations
- Fade in/out
- Slide in/up
- Scale transform
- Blob background animations
- Smooth transitions on all interactive elements

---

## 🔒 Security Best Practices

1. **Encryption**
   - AES-256 for file encryption
   - RSA-2048 for key wrapping
   - PBKDF2 for password derivation

2. **Authentication**
   - JWT tokens with expiration
   - Secure token refresh flow
   - Password validation rules

3. **API Security**
   - CORS whitelisting
   - Rate limiting on auth endpoints
   - Input validation and sanitization
   - Secure HTTP headers

4. **Data Protection**
   - Never store passwords in plaintext
   - Encrypted private keys in database
   - No sensitive data in localStorage (tokens only)
   - Secure session management

---

## 🚢 Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)

Key requirements:
- PostgreSQL database (production)
- Redis for caching (optional)
- Docker containerization
- Nginx reverse proxy
- SSL/TLS certificates
- Environment variables configuration

---

## 🧪 Testing

### Frontend Tests
```bash
cd secure-vault-frontend
npm run test
npm run test:e2e
```

### Backend Tests
```bash
cd secure-vault-backend
python manage.py test
```

---

## 📊 Performance Metrics

- **Page Load** — < 2 seconds (optimized)
- **File Upload** — Streaming with progress
- **File Decryption** — < 1 second (small files)
- **Lighthouse Score** — 90+ (desktop)
- **Mobile Performance** — Optimized for 4G

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Commit with descriptive messages
4. Push to origin
5. Create a pull request

---

## 📝 License

Proprietary — All rights reserved

---

## 👨‍💻 Author

**Heli Sudani** — Full-Stack Architect

---

## 🙋 Support

For issues or questions:
1. Check existing documentation
2. Review API error messages
3. Check browser console for errors
4. Enable debug logging in backend

---

## 🔄 Version

**v2.0.0** — Production-ready with modern UI

Last updated: January 2026
