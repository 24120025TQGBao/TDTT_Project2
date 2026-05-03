# Finance Manager App

Simple finance manager for `[LAB - 2] API FIREBASE.pdf`. The project is split into a Next.js frontend and a FastAPI backend, uses Firebase Authentication for login, and stores each user's income/expense records in Firestore.

## Student Information

Student ID: 24120025
Student Full Name: Thiều Quới Gia Bảo
Class: 24CTT5

## Lab Compliance

| Requirement | Current implementation |
| --- | --- |
| Separate frontend and backend | `frontend/` contains the Next.js UI, `backend/` contains the FastAPI API. |
| Firebase Authentication | Frontend supports Google Login and Email/Password through Firebase Auth. |
| Current user and logout | Backend verifies Firebase ID tokens; frontend shows the signed-in user and a logout button. |
| Main feature | Users can add income or expense transactions. |
| Database save/read | Backend saves transactions to Firestore and reads them back per user. |
| Required backend endpoints | `GET /`, `GET /health`, `GET /auth/me`, `POST /auth/verify`, `POST /expenses`, `GET /expenses`, `GET /expenses/summary`. |
| README and run instructions | This file documents environment setup, frontend/backend startup, API notes, and demo flow. |
| Secrets excluded | Real env files and service account JSON files are ignored by `.gitignore`. |

## Features

- Firebase Authentication with Google Login and Email/Password.
- FastAPI backend validates Firebase ID tokens from `Authorization: Bearer <token>`.
- Add income or expense records after login.
- View saved transactions and a summary of income, expenses, and balance.
- Firestore data is stored per Firebase user.

## Project Structure

```text
project/
|-- frontend/
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.js
|   |   `-- page.js
|   |-- lib/
|   |   `-- firebase.js
|   |-- .env.local.example
|   |-- eslint.config.mjs
|   |-- next.config.mjs
|   |-- package-lock.json
|   `-- package.json
|-- backend/
|   |-- .env.example
|   `-- app/
|       |-- config.py
|       |-- dependencies.py
|       |-- firebase.py
|       |-- main.py
|       `-- schemas.py
|-- requirements.txt
|-- .gitignore
`-- README.md
```

## 1. Backend Environment

Create and activate a Python virtual environment from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The backend uses FastAPI, Uvicorn, Firebase Admin SDK, Firestore, and Pydantic settings.

## 2. Firebase Setup

Create a Firebase project and enable the services used by the app:

1. Enable `Authentication -> Sign-in method -> Email/Password`.
2. Enable `Authentication -> Sign-in method -> Google`.
3. Create a Firestore database.
4. Create a Firebase web app and copy its web configuration values.
5. Generate a Firebase Admin service account key from `Project settings -> Service accounts -> Generate new private key`.

Do not commit real `.env` files or service account JSON files.

## 3. Backend Configuration

Copy the backend example file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
APP_NAME=Finance Manager API
DEBUG=true
ALLOWED_ORIGINS=["http://127.0.0.1:3000","http://localhost:3000"]

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json
```

`FIREBASE_SERVICE_ACCOUNT_PATH` must point to the Firebase Admin JSON file. This JSON includes fields such as `project_id`, `private_key`, and `client_email`.

## 4. Frontend Configuration

Copy the frontend example file:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local` with the Firebase web app values:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-web-app-id
```

The frontend web config is different from the backend service account JSON.

## 5. Run Backend

From the repository root:

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Useful checks:

```text
GET http://127.0.0.1:8000/
GET http://127.0.0.1:8000/health
```

## 6. Run Frontend

The frontend is a Next.js app and requires Node.js `>=18.18.0`.

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:3000
```

For a production build:

```bash
cd frontend
npm run build
npm start
```

## 7. API Endpoints

Public endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Basic API message. |
| `GET` | `/health` | Health check. |

Authenticated endpoints require:

```text
Authorization: Bearer <Firebase ID token>
```

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/auth/me` | Returns the current Firebase user profile. |
| `POST` | `/auth/verify` | Verifies the current Firebase token. |
| `POST` | `/expenses` | Creates an income or expense record. |
| `GET` | `/expenses` | Lists saved records for the current user. |
| `GET` | `/expenses/summary` | Returns total income, total expenses, and balance. |

Example `POST /expenses` body:

```json
{
  "title": "Lunch",
  "amount": 8.5,
  "category": "Food",
  "type": "expense",
  "note": "Campus meal"
}
```

`type` can be `"expense"` or `"income"`.

## 8. Firestore Data Model

Each user's transactions are stored under their Firebase UID:

```text
users/{uid}/expenses/{expenseId}
```

Each record stores:

- `title`
- `amount`
- `category`
- `note`
- `type`
- `user_id`
- `created_at`

## 9. Demo Flow

1. Start the backend.
2. Start the frontend.
3. Log in with Firebase using Google or Email/Password.
4. Confirm the signed-in user appears in the UI.
5. Add an income or expense transaction.
6. Confirm the saved transaction appears in the list.
7. Confirm the summary updates.
8. Open Firestore and confirm the data exists under `users/{uid}/expenses`.
9. Log out.

## 10. Video Demo

Add your demo video link here before submitting:

```text
[VIDEO_DEMO_LINK_HERE](https://youtu.be/uIIGWGud2uE)
```

## Notes

- Restart the frontend after changing `frontend/.env.local`.
- Restart the backend after changing `backend/.env`.
- Keep `backend/.env`, `frontend/.env.local`, and Firebase service account JSON files out of Git.
