import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext.jsx";
import { login as apiLogin } from "@utils/backendClient.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await apiLogin(form);
      if (res?.token) {
        login(res.token, res.user || { email: form.email });
        navigate("/");
      } else {
        setErr(res?.error || "Login failed");
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-[var(--background)]">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 border border-[var(--border)] bg-[var(--card)]">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <label className="text-sm">Email</label>
        <input
          className="input mb-3"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <label className="text-sm">Password</label>
        <input
          className="input mb-4"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {err && <div className="text-sm text-red-500 mb-3">{err}</div>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}