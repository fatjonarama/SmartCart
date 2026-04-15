import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

  .reg-root {
    min-height: 100vh;
    background: #0A0A0A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Montserrat', sans-serif;
    padding: 100px 24px 60px;
    position: relative;
    overflow: hidden;
  }

  .reg-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.05) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.03) 0%, transparent 50%);
  }

  .reg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px);
    background-size: 80px 80px;
  }

  .reg-card {
    width: 100%;
    max-width: 520px;
    position: relative;
    z-index: 1;
  }

  .reg-header {
    margin-bottom: 50px;
  }

  .reg-eyebrow {
    font-size: 9px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: #C9A84C;
    font-weight: 500;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .reg-eyebrow::before {
    content: '';
    width: 30px; height: 1px;
    background: #C9A84C;
    opacity: 0.5;
  }

  .reg-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px;
    font-weight: 300;
    color: #F5F0E8;
    line-height: 1;
    margin-bottom: 12px;
  }

  .reg-title em { font-style: italic; color: #C9A84C; }

  .reg-sub {
    font-size: 12px;
    color: #888880;
    font-weight: 300;
    letter-spacing: 0.5px;
  }

  .reg-form { display: flex; flex-direction: column; gap: 28px; }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .form-group { display: flex; flex-direction: column; }

  .form-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 10px;
  }

  .form-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(245,240,232,0.12);
    padding: 12px 0;
    color: #F5F0E8;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    font-weight: 300;
    outline: none;
    transition: border-color 0.3s;
  }

  .form-input::placeholder { color: rgba(245,240,232,0.18); }
  .form-input:focus { border-bottom-color: #C9A84C; }

  .reg-error {
    padding: 14px 20px;
    background: rgba(201,68,68,0.08);
    border-left: 2px solid #C94444;
    color: #E88080;
    font-size: 12px;
    font-weight: 300;
  }

  .reg-success {
    padding: 14px 20px;
    background: rgba(76,201,128,0.08);
    border-left: 2px solid #4CC980;
    color: #80E8A8;
    font-size: 12px;
    font-weight: 300;
  }

  .submit-btn {
    padding: 18px;
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
  }

  .submit-btn:hover:not(:disabled) {
    background: #E8D5A3;
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(201,168,76,0.25);
  }

  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .reg-footer {
    text-align: center;
    margin-top: 32px;
    font-size: 12px;
    color: #888880;
    font-weight: 300;
  }

  .reg-footer a {
    color: #C9A84C;
    text-decoration: none;
    font-weight: 500;
  }

  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
    .reg-title { font-size: 40px; }
  }
`;

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setMessage("Ju lutem plotësoni të gjitha fushat!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
     await axios.post("http://localhost:5000/api/v1/users/register", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Regjistrimi dështoi!");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="reg-root">
        <div className="reg-bg" />
        <div className="reg-grid" />

        <div className="reg-card">
          <div className="reg-header">
            <div className="reg-eyebrow">SmartCart Membership</div>
            <h1 className="reg-title">Join the<br /><em>Elite</em></h1>
            <p className="reg-sub">Create your account and discover a world of premium shopping</p>
          </div>

          {message && <div className="reg-error" style={{ marginBottom: "28px" }}>{message}</div>}
          {success && <div className="reg-success" style={{ marginBottom: "28px" }}>✓ Account created! Redirecting to login...</div>}

          <div className="reg-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} onKeyDown={e => e.key === "Enter" && handleRegister()} className="form-input" />
            </div>

            <button className="submit-btn" onClick={handleRegister} disabled={loading || success}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </div>

          <p className="reg-footer">
            Already a member?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}