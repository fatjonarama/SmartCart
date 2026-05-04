import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
    .rp-root { min-height:100vh; background:#0A0A0A; display:flex; align-items:center; justify-content:center; font-family:'Montserrat',sans-serif; padding:20px; }
    .rp-input { width:100%; padding:14px 0; background:transparent; border:none; border-bottom:1px solid rgba(245,240,232,0.15); color:#F5F0E8; font-family:'Montserrat',sans-serif; font-size:14px; font-weight:300; outline:none; transition:border-color 0.3s; box-sizing:border-box; }
    .rp-input:focus { border-bottom-color:#C9A84C; }
    .rp-input::placeholder { color:rgba(245,240,232,0.2); }
    .rp-btn { width:100%; padding:16px; background:#C9A84C; color:#0A0A0A; border:none; font-family:'Montserrat',sans-serif; font-size:10px; font-weight:700; letter-spacing:4px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:24px; }
    .rp-btn:hover:not(:disabled) { background:#E8D5A3; transform:translateY(-2px); }
    .rp-btn:disabled { opacity:0.5; cursor:not-allowed; }
  `;

  const handleSubmit = async () => {
    setError("");

    if (!token) {
      setError("Token i pavlefshëm!");
      return;
    }
    if (newPassword.length < 6) {
      setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen!");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/v1/users/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Gabim gjatë resetimit!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rp-root">
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <Link to="/" style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "28px", fontWeight: "300", color: "#C9A84C", letterSpacing: "6px", textTransform: "uppercase", textDecoration: "none", display: "block", marginBottom: "40px", textAlign: "center" }}>
            SmartCart
          </Link>

          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "60px", marginBottom: "24px" }}>✅</div>
              <h2 style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "32px", fontWeight: "300", color: "#F5F0E8", marginBottom: "12px" }}>
                Fjalëkalimi u <em style={{ fontStyle: "italic", color: "#C9A84C" }}>ndryshua!</em>
              </h2>
              <p style={{ fontSize: "13px", color: "#888880", fontWeight: "300", lineHeight: "1.8", marginBottom: "24px" }}>
                Duke të ridrejtuar te login...
              </p>
              <Link to="/login" style={{ color: "#C9A84C", textDecoration: "none", fontSize: "12px", letterSpacing: "2px" }}>
                ← Shko te Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "36px", fontWeight: "300", color: "#F5F0E8", marginBottom: "8px" }}>
                Reset <em style={{ fontStyle: "italic", color: "#C9A84C" }}>Password</em>
              </h2>
              <p style={{ fontSize: "12px", color: "#888880", marginBottom: "40px", fontWeight: "300" }}>
                Shkruaj fjalëkalimin tënd të ri.
              </p>

              {error && (
                <div style={{ padding: "12px 16px", background: "rgba(229,115,115,0.1)", border: "1px solid rgba(229,115,115,0.3)", color: "#E88080", fontSize: "12px", marginBottom: "20px", borderRadius: "2px" }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "9px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
                  Fjalëkalimi i Ri
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="rp-input"
                />
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "9px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
                  Konfirmo Fjalëkalimin
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="rp-input"
                />
              </div>

              <button className="rp-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Duke u procesuar..." : "Ndrysho Fjalëkalimin →"}
              </button>

              <p style={{ textAlign: "center", marginTop: "28px", fontSize: "12px", color: "#888880" }}>
                <Link to="/login" style={{ color: "#C9A84C", textDecoration: "none" }}>← Kthehu te Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}