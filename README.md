# Ciphra

Ciphra is a full-stack encrypted workspace for private files, secure sharing, password storage, and account recovery.

The free launch-domain target is `ciphra.is-a.dev`.

## What It Does

- Encrypts files in the browser before upload.
- Stores encrypted uploads by user and file type.
- Supports photos, PDFs, documents, archives, code, audio, video, and unknown file types.
- Stores website credentials in an encrypted password locker.
- Uses verified email for account verification and account-password recovery.
- Keeps vault unlock separate from account login.

## Local Storage

Local development stores uploaded encrypted files on disk D:

```text
D:\CiphraStorage
```

Upload paths are organized by user and type:

```text
user_1/photos/...
user_1/pdfs/...
user_1/documents/...
user_1/archives/...
user_1/other/...
```

## Backend

```powershell
cd secure-vault-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Frontend

```powershell
cd secure-vault-frontend
npm install
npm run dev
```

## Production Notes

Use `.env.production.example` as the template for deployment secrets. Do not commit real email passwords, SMTP credentials, database passwords, or object-storage keys.

For Gmail SMTP, create a Gmail App Password and put it only in the deployed `.env.production`.
