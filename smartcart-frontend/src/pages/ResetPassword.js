import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleReset = async () => {
    try {
      await axios.post("https://smartcart-ks.up.railway.app/api/v1/users/reset-password", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gabim gjatë resetimit.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif" }}>
      <div style={{ width: "400px", color: "#F5F0E8" }}>
        <h2 style={{ color: "#C9A84C", marginBottom: "24px" }}>Reset Password</h2>
        {message && <p style={{ color: "#E88080" }}>{message}</p>}
        {success ? (
          <p style={{ color: "#4CC980" }}>Fjalëkalimi u ndryshua! Po ridrejtohesh...</p>
        ) : (
          <>
            <input
              type="password"
              placeholder="Fjalëkalimi i ri"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(245,240,232,0.2)", color: "#F5F0E8", marginBottom: "16px" }}
            />
            <button onClick={handleReset} style={{ width: "100%", padding: "14px", background: "#C9A84C", color: "#0A0A0A", border: "none", cursor: "pointer", fontWeight: "700" }}>
              NDRYSHO FJALËKALIMIN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
