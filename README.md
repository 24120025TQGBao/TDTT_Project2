# Finance Manager App

Simple finance managing app built for the lab requirement in `[LAB - 2] API FIREBASE.pdf`.

## Features

- Firebase Authentication with Email/Password on the frontend
- FastAPI backend with required endpoints:
  - `GET /`
  - `GET /health`
  - `GET /auth/me`
  - `POST /expenses`
  - `GET /expenses`
- Firestore database storage per user
- Next.js frontend to login, add transactions, read saved transactions, and view a summary

## Project structure

```text
project/
|-- frontend/
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.js
|   |   `-- page.js
|   |-- .env.local.example
|   |-- next.config.mjs
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

## 1. Create environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Firebase setup

1. Create a Firebase project.
2. Enable `Authentication -> Sign-in method -> Email/Password`.
3. Create a Firestore database.
4. Generate a Firebase service account key JSON from `Project settings -> Service accounts`.
5. Copy `backend/.env.example` to `backend/.env`.
6. Update the values in `backend/.env`, especially:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_SERVICE_ACCOUNT_PATH`
7. Copy `frontend/.env.local.example` to `frontend/.env.local`.
8. Fill in the Firebase web app values in `frontend/.env.local`.

## 3. Run backend

```bash
uvicorn backend.app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

## 4. Run frontend

Install the frontend dependencies:

```bash
cd frontend
npm install
```

Run the Next.js frontend:

```bash
cd frontend
npm run dev
```

Then open `http://127.0.0.1:3000`.

## 5. Demo flow

1. Start backend.
2. Start frontend.
3. Login with a Firebase Email/Password user.
4. Add income or expense records.
5. Check the saved list and summary.
6. Confirm the same data appears in Firestore.

## API notes

- Backend verifies Firebase ID tokens from the `Authorization: Bearer <token>` header.
- Each user stores data in:

```text
users/{uid}/expenses/{expenseId}
```

## Video demo

Add your demo video link here before submitting:

`VIDEO_DEMO_LINK_HERE`
