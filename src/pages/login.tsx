import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";
import AppHeader from "../components/AppHeader";
import "../styles/login.css";

export default function Login() {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
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
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Accept plain-text or bcrypt-hashed passwords
      let isPasswordValid = data.password_hash === password;
      if (!isPasswordValid) {
        try {
          isPasswordValid = await bcrypt.compare(password, data.password_hash);
        } catch {
          isPasswordValid = false;
        }
      }

      if (!isPasswordValid) {
        setError("Invalid username or password");
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
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── GIF banner (no user strip on login) ── */}
      <AppHeader />

      {/* ── Login form centred below the banner ── */}
      <div className="login-body">
        <div className="login-card">
          <h2 className="login-title">Sign in to continue</h2>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <a href="#" className="forgot-password">Forgot Password?</a>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
