import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, ShieldCheck, BarChart3, Users } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";
import "../styles/login.css";

export default function Login() {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }

      let isPasswordValid = data.password_hash === password;
      if (!isPasswordValid) {
        try { isPasswordValid = await bcrypt.compare(password, data.password_hash); }
        catch { isPasswordValid = false; }
      }

      if (!isPasswordValid) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify({
        id:        data.id,
        username:  data.username,
        full_name: data.full_name,
        role:      data.role,
        email:     data.email,
      }));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ════════════════════════════════════════════
          LEFT PANEL — branding + banner image
      ════════════════════════════════════════════ */}
      <div className="lp-left">
        {/* Overlay gradient so text is readable */}
        <div className="lp-left-overlay" />

        {/* Banner photo fills the panel */}
        <img src="/banner3.jpg" alt="KITSW Campus" className="lp-banner-img" draggable={false} />

        {/* Content sits on top of the image */}
        <div className="lp-left-content">
          {/* Logo mark */}
          <div className="lp-logo-mark">
            <GraduationCap size={32} strokeWidth={1.8} />
          </div>

          <h1 className="lp-college-name">
            Kakatiya Institute of Technology &amp; Science 
          </h1>
          <p className="lp-college-sub">Warangal, Telangana </p>

          <div className="lp-divider" />

          <p className="lp-module-name"></p>
          <p className="lp-module-desc">
            Centralised platform for fee collection, receipts, due tracking,
            and financial reporting across all departments.
          </p>

          {/* Feature pills */}
          <div className="lp-features">
            {[
              { icon: <BarChart3 size={14} />, label: "Real-time Reports" },
              { icon: <ShieldCheck size={14} />, label: "Role-based Access" },
              { icon: <Users size={14} />,      label: "Multi-user Support" },
            ].map(({ icon, label }) => (
              <span key={label} className="lp-feature-pill">
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT PANEL — login form
      ════════════════════════════════════════════ */}
      <div className="lp-right">
        <div className="lp-form-wrap">

          {/* Header */}
          <div className="lp-form-header">
            <div className="lp-form-icon">
              <ShieldCheck size={22} strokeWidth={1.8} />
            </div>
            <h2 className="lp-form-title">Welcome back</h2>
            <p className="lp-form-sub">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="lp-error" role="alert">
              <span className="lp-error-dot" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="lp-form">
            <div className="lp-field">
              <label htmlFor="lp-username" className="lp-label">Username</label>
              <input
                id="lp-username"
                type="text"
                className="lp-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="lp-field">
              <div className="lp-label-row">
                <label htmlFor="lp-password" className="lp-label">Password</label>
                <a href="#" className="lp-forgot">Forgot password?</a>
              </div>
              <div className="lp-password-wrap">
                <input
                  id="lp-password"
                  type={showPassword ? "text" : "password"}
                  className="lp-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <span className="lp-spinner" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="lp-footer-note">
            © {new Date().getFullYear()} KITSW — Accounts Department. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
