"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "../lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const EMPTY_SUMMARY = {
  total_income: 0,
  total_expense: 0,
  balance: 0,
};

const EMPTY_EXPENSE_FORM = {
  title: "",
  amount: "",
  category: "",
  type: "expense",
  note: "",
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState("");
  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [expenses, setExpenses] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);

  function showMessage(text, type) {
    setMessage(text);
    setMessageType(type);
  }

  function clearMessage() {
    setMessage("");
    setMessageType("info");
  }

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          cache: "no-store",
        });
        const data = await response.json();
        setHealthStatus(data.status === "ok" ? "Online" : "Unknown");
      } catch {
        setHealthStatus("Backend offline");
      }
    }

    void loadHealth();
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setToken("");
        setSummary(EMPTY_SUMMARY);
        setExpenses([]);
        return;
      }

      const idToken = await user.getIdToken();
      setCurrentUser({
        email: user.email,
        uid: user.uid,
      });
      setToken(idToken);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function fetchDashboard() {
      try {
        const [me, summaryData, expenseData] = await Promise.all([
          apiFetch("/auth/me", token),
          apiFetch("/expenses/summary", token),
          apiFetch("/expenses", token),
        ]);

        setCurrentUser((prev) => ({
          email: me.email ?? prev?.email ?? "No email",
          uid: me.uid,
        }));
        setSummary(summaryData);
        setExpenses(expenseData);
      } catch (error) {
        showMessage(error.message, "error");
      }
    }

    void fetchDashboard();
  }, [token]);

  async function loadDashboard(authToken) {
    try {
      const [me, summaryData, expenseData] = await Promise.all([
        apiFetch("/auth/me", authToken),
        apiFetch("/expenses/summary", authToken),
        apiFetch("/expenses", authToken),
      ]);

      setCurrentUser((prev) => ({
        email: me.email ?? prev?.email ?? "No email",
        uid: me.uid,
      }));
      setSummary(summaryData);
      setExpenses(expenseData);
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearMessage();

    if (!auth) {
      showMessage("Firebase environment values are missing.", "error");
      return;
    }

    setIsBusy(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.email.trim(),
        loginForm.password
      );
      showMessage("Login successful.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGoogleLogin() {
    clearMessage();

    if (!auth) {
      showMessage("Firebase environment values are missing.", "error");
      return;
    }

    setIsBusy(true);

    try {
      await signInWithPopup(auth, googleProvider);
      showMessage("Google login successful.", "success");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        showMessage("Google login was canceled.", "info");
      } else {
        showMessage(error.message, "error");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    if (!auth) {
      return;
    }

    setIsBusy(true);
    try {
      await signOut(auth);
      showMessage("Logged out.", "success");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault();
    clearMessage();
    setIsBusy(true);

    const payload = {
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      category: expenseForm.category.trim(),
      type: expenseForm.type,
      note: expenseForm.note.trim(),
    };

    try {
      await apiFetch("/expenses", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setExpenseForm(EMPTY_EXPENSE_FORM);
      showMessage("Transaction saved.", "success");
      await loadDashboard(token);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Next.js 16 + FastAPI + Firebase</p>
          <h1>Finance Manager</h1>
          <p className="subtitle">
            Authenticate with Firebase, post income and expenses through
            FastAPI, and read your Firestore-backed transaction history from one
            dashboard.
          </p>
        </div>

        <div className="statusCard">
          <p className="cardLabel">Backend Status</p>
          <p className="statusValue">{healthStatus}</p>
          <p className="muted">
            API base: <code>{API_BASE_URL}</code>
          </p>
          {currentUser ? (
            <button
              type="button"
              className="ghost"
              onClick={handleLogout}
              disabled={isBusy}
            >
              Logout
            </button>
          ) : null}
        </div>
      </section>

      {!isFirebaseConfigured ? (
        <section className="panel warningPanel">
          <h2>Firebase config missing</h2>
          <p className="panelCopy">
            Copy <code>frontend/.env.local.example</code> to{" "}
            <code>frontend/.env.local</code> and fill in the Firebase web app
            values before logging in.
          </p>
        </section>
      ) : null}

      <section className="grid">
        <article className="panel">
          <h2>Firebase Login</h2>
          <p className="panelCopy">
            Sign in with Google or use an Email/Password account from Firebase
            Authentication.
          </p>
          <div className="authActions">
            <button
              type="button"
              className="secondaryButton"
              onClick={handleGoogleLogin}
              disabled={isBusy || !isFirebaseConfigured}
            >
              {isBusy ? "Please wait..." : "Continue with Google"}
            </button>
            <p className="muted authDivider">or use email and password</p>
          </div>
          <form className="stack" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <button type="submit" disabled={isBusy || !isFirebaseConfigured}>
              {isBusy ? "Please wait..." : "Login"}
            </button>
          </form>
          {currentUser ? (
            <div className="userBox">
              <p>{currentUser.email ?? "No email"}</p>
              <p className="muted">UID: {currentUser.uid}</p>
            </div>
          ) : null}
        </article>

        <article className="panel">
          <h2>Add Transaction</h2>
          {currentUser ? (
            <form className="stack" onSubmit={handleExpenseSubmit}>
              <label>
                Title
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Category
                <input
                  type="text"
                  required
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Type
                <select
                  value={expenseForm.type}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label>
                Note
                <textarea
                  rows={3}
                  value={expenseForm.note}
                  onChange={(event) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      note: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" disabled={isBusy}>
                {isBusy ? "Saving..." : "Save transaction"}
              </button>
            </form>
          ) : (
            <p className="muted">Log in first to add transactions.</p>
          )}
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Summary</h2>
          <div className="summary">
            <div>
              <span>Income</span>
              <strong>{formatCurrency(summary.total_income)}</strong>
            </div>
            <div>
              <span>Expense</span>
              <strong>{formatCurrency(summary.total_expense)}</strong>
            </div>
            <div>
              <span>Balance</span>
              <strong>{formatCurrency(summary.balance)}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Saved Transactions</h2>
          <ul className="expenseList">
            {expenses.length ? (
              expenses.map((item) => (
                <li key={item.id}>
                  <div className="expenseRow">
                    <div className="expenseMeta">
                      <strong>{item.title}</strong>
                      <span className="muted">
                        {item.category} •{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span>{item.note || "No note"}</span>
                    </div>
                    <div className="expenseMeta alignRight">
                      <span className="tag">{item.type}</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No data yet.</li>
            )}
          </ul>
        </article>
      </section>

      <p className={`message ${messageType}`}>{message}</p>
    </main>
  );
}

async function apiFetch(path, authToken, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {
    throw new Error(
      "Network request failed. Check that the backend is running and CORS is configured for the frontend origin."
    );
  }

  if (!response.ok) {
    let detail = "Request failed.";
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  return response.json();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
}
