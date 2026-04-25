"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState("");
  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [expenses, setExpenses] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    type: "expense",
    note: "",
  });

  useEffect(() => {
    checkHealth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setToken("");
        resetDashboard();
        return;
      }

      const idToken = await user.getIdToken();
      setCurrentUser(user);
      setToken(idToken);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadDashboard(token);
  }, [token]);

  async function checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setHealthStatus(data.status === "ok" ? "Online" : "Unknown");
    } catch {
      setHealthStatus("Backend offline");
    }
  }

  async function loadDashboard(authToken) {
    try {
      const [me, summaryData, expenseData] = await Promise.all([
        apiFetch("/auth/me", authToken),
        apiFetch("/expenses/summary", authToken),
        apiFetch("/expenses", authToken),
      ]);

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              email: me.email ?? prev.email,
              uid: me.uid,
            }
          : me
      );
      setSummary(summaryData);
      setExpenses(expenseData);
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearMessage();

    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.email.trim(),
        loginForm.password
      );
      showMessage("Login successful.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function handleLogout() {
    await signOut(auth);
    showMessage("Logged out.", "success");
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault();
    clearMessage();

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
      setExpenseForm({
        title: "",
        amount: "",
        category: "",
        type: "expense",
        note: "",
      });
      showMessage("Transaction saved.", "success");
      await loadDashboard(token);
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  function resetDashboard() {
    setSummary({ total_income: 0, total_expense: 0, balance: 0 });
    setExpenses([]);
  }

  function showMessage(text, type) {
    setMessage(text);
    setMessageType(type);
  }

  function clearMessage() {
    setMessage("");
    setMessageType("info");
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Next.js + FastAPI + Firebase</p>
          <h1>Simple Finance Manager</h1>
          <p className="subtitle">
            Sign in with Firebase, add income or expenses, and read your saved
            transactions from Firestore through FastAPI.
          </p>
        </div>
        <div className="statusCard">
          <p className="cardLabel">Backend</p>
          <p>{healthStatus}</p>
          {currentUser ? (
            <button type="button" className="ghost" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Firebase Login</h2>
          <p className="panelCopy">
            Use Email/Password that you enabled in Firebase Authentication.
          </p>
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
            <button type="submit">Login</button>
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
              <button type="submit">Save transaction</button>
            </form>
          ) : (
            <p className="muted">Log in first to add data.</p>
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`,
    },
  });

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
  }).format(value);
}
