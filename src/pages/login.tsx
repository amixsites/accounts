import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";
import "../styles/login.css";

const bannerImage = new URL("../../banner3.jpg", import.meta.url).href;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          full_name: data.full_name,
          role: data.role,
          email: data.email,
        })
      );

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
      <div className="login-split">
        <div className="login-image-section">
          <img
            src={bannerImage}
            alt="Premium accounts management dashboard"
            className="login-banner-img"
            loading="eager"
          />
          <div className="login-image-overlay" />
        </div>

        <div className="login-form-section">
          <div className="login-card">
            <div className="brand-block">
              <div className="brand-mark">A</div>
              <div>
                <p className="brand-name">Accounts</p>
                <p className="brand-subtitle">financial operations</p>
              </div>
            </div>

            <div className="section-heading">
              <h2>Welcome back</h2>
              <p>Sign in to continue to your dashboard.</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="username">Email or Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="you@example.com"
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
                    placeholder="Enter your password"
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

              <div className="form-meta">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                <span>{loading ? "Signing in…" : "Login"}</span>
                {loading && <span className="login-spinner" aria-hidden="true" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
