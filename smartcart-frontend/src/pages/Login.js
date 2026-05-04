import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { 
  Alert, 
  CircularProgress, 
  Snackbar,
  Chip
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

  .login-root {
    min-height: 100vh;
    background: #0A0A0A;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'Montserrat', sans-serif;
  }

  .login-left {
    background: linear-gradient(135deg, #111 0%, #0A0A0A 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 60px;
    position: relative;
    overflow: hidden;
    border-right: 1px solid rgba(201,168,76,0.15);
  }

  .login-left-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
  }

  .login-left-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .login-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: #C9A84C;
    letter-spacing: 8px;
    text-transform: uppercase;
    position: relative;
    z-index: 1;
    margin-bottom: 24px;
  }

  .login-tagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 300;
    font-style: italic;
    color: rgba(245,240,232,0.4);
    position: relative;
    z-index: 1;
    text-align: center;
    line-height: 1.6;
  }

  .login-divider {
    width: 1px;
    height: 80px;
    background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.4), transparent);
    margin: 32px 0;
    position: relative;
    z-index: 1;
  }

  .login-features {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
  }

  .login-feature {
    display: flex;
    align-items: center;
    gap: 16px;
    color: rgba(245,240,232,0.5);
    font-size: 12px;
    letter-spacing: 1px;
    font-weight: 300;
  }

  .login-feature-dot {
    width: 6px; height: 6px;
    border: 1px solid #C9A84C;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .login-right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 60px;
    background: #0A0A0A;
  }

  .login-form {
    width: 100%;
    max-width: 400px;
  }

  .login-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 300;
    color: #F5F0E8;
    margin-bottom: 8px;
    line-height: 1.1;
  }

  .login-heading em {
    font-style: italic;
    color: #C9A84C;
  }

  .login-sub {
    font-size: 12px;
    color: #888880;
    margin-bottom: 50px;
    font-weight: 300;
    letter-spacing: 1px;
  }

  .form-group {
    margin-bottom: 28px;
  }

  .form-label {
    display: block;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 10px;
  }

  .form-input {
    width: 100%;
    padding: 14px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(245,240,232,0.15);
    color: #F5F0E8;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    font-weight: 300;
    outline: none;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }

  .form-input.error { border-bottom-color: #E57373; }
  .form-input::placeholder { color: rgba(245,240,232,0.2); }
  .form-input:focus { border-bottom-color: #C9A84C; }

  .field-error {
    color: #E57373;
    font-size: 10px;
    letter-spacing: 1px;
    margin-top: 6px;
    display: block;
  }

  .submit-btn {
    width: 100%;
    padding: 16px;
    background: #C9A84C;
    color: #0A0A0A;
    border: none;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .submit-btn:hover:not(:disabled) {
    background: #E8D5A3;
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(201,168,76,0.25);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .login-footer-text {
    text-align: center;
    margin-top: 36px;
    font-size: 12px;
    color: #888880;
    font-weight: 300;
  }

  .login-footer-text a {
    color: #C9A84C;
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 1px;
  }

  .login-footer-text a:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .login-root { grid-template-columns: 1fr; }
    .login-left { display: none; }
    .login-right { padding: 60px 32px; }
  }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateField = (name, value) => {
    let error = "";
    if (name === "email") {
      if (!value) error = "Email-i është i detyrueshëm!";
      else if (!/\S+@\S+\.\S+/.test(value)) error = "Email-i nuk është i vlefshëm!";
    }
    if (name === "password") {
      if (!value) error = "Fjalëkalimi është i detyrueshëm!";
      else if (value.length < 6) error = "Fjalëkalimi duhet të ketë të paktën 6 karaktere!";
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleLogin = async () => {
    const isEmailValid = validateField("email", email);
    const isPassValid = validateField("password", password);

    if (!isEmailValid || !isPassValid) {
      setMessage("Ju lutem korrigjoni gabimet para se të vazhdoni!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/v1/users/login", { 
        email, 
        password 
      });

      if (res.data.accessToken) {
        setSuccessOpen(true);
        setTimeout(() => {
          login(res.data.accessToken); 
          navigate("/products");
        }, 1200);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Identifikimi dështoi. Kontrolloni kredencialet!";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        {/* LEFT PANEL */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-grid" />
          <div className="login-brand">SmartCart</div>
          <div className="login-divider" />
          <p className="login-tagline">Where luxury meets<br />the art of shopping</p>
          <div className="login-divider" />
          <div className="login-features">
            {["Curated premium products", "Secure & encrypted checkout", "Exclusive member benefits", "24/7 concierge support"].map((f, i) => (
              <div key={i} className="login-feature">
                <div className="login-feature-dot" />
                {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "40px", position: "relative", zIndex: 1, display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <Chip label="JWT Secured" size="small" sx={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", fontSize: "9px", letterSpacing: "1px" }} />
            <Chip label="256-bit Encrypted" size="small" sx={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", fontSize: "9px", letterSpacing: "1px" }} />
            <Chip label="GDPR Compliant" size="small" sx={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", fontSize: "9px", letterSpacing: "1px" }} />
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="login-right">
          <div className="login-form">
            <h1 className="login-heading">Welcome<br /><em>Back</em></h1>
            <p className="login-sub">Sign in to your account to continue</p>

            {message && (
              <Alert
                severity="error"
                sx={{
                  marginBottom: "24px",
                  background: "rgba(201,68,68,0.08)",
                  border: "1px solid rgba(229,115,115,0.3)",
                  color: "#E88080",
                  "& .MuiAlert-icon": { color: "#E88080" },
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "12px",
                }}
              >
                {message}
              </Alert>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  validateField("email", e.target.value);
                }}
                className={`form-input ${errors.email ? "error" : ""}`}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  validateField("password", e.target.value);
                }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className={`form-input ${errors.password ? "error" : ""}`}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {/* FORGOT PASSWORD LINK */}
            <div style={{ textAlign: "right", marginTop: "-16px", marginBottom: "16px" }}>
              <Link 
                to="/forgot-password" 
                style={{ color: "#888880", fontSize: "11px", textDecoration: "none", letterSpacing: "1px" }}
                onMouseOver={e => e.target.style.color = "#C9A84C"}
                onMouseOut={e => e.target.style.color = "#888880"}
              >
                Forgot password?
              </Link>
            </div>

            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <>
                  <CircularProgress size={14} sx={{ color: "#0A0A0A" }} />
                  Signing In...
                </>
              ) : "Sign In →"}
            </button>

            <p className="login-footer-text">
              New to SmartCart?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>

      <Snackbar
        open={successOpen}
        autoHideDuration={1000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          icon={<CheckCircleOutlineIcon />}
          severity="success"
          sx={{
            background: "rgba(76,175,80,0.15)",
            border: "1px solid rgba(76,175,80,0.3)",
            color: "#81C784",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Login i suksesshëm! Duke ridrejtuar...
        </Alert>
      </Snackbar>
    </>
  );
}