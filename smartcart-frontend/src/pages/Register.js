import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const bg = isDark ? "#0A0A0A" : "#F5F5F0";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor = isDark ? "#888880" : "#555550";
  const inputBorder = isDark ? "rgba(245,240,232,0.12)" : "rgba(0,0,0,0.15)";
  const inputColor = isDark ? "#F5F0E8" : "#1A1A1A";

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setMessage(t.fillAllFields);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await axios.post("https://smartcart-ks.up.railway.app/api/v1/users/register", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      setMessage(err.response?.data?.message || t.registerFailed);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", padding: "100px 24px 60px", position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div style={{ width: "100%", maxWidth: "520px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: "50px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "30px", height: "1px", background: "#C9A84C", opacity: 0.5, display: "inline-block" }} />
            {t.smartcartMembership}
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: "300", color: textColor, lineHeight: "1", marginBottom: "12px" }}>
            {t.joinTheElite}<br /><em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.joinTheEliteEm}</em>
          </h1>
          <p style={{ fontSize: "12px", color: grayColor, fontWeight: "300", letterSpacing: "0.5px" }}>
            {t.joinSub}
          </p>
        </div>

        {message && (
          <div style={{ padding: "14px 20px", background: "rgba(201,68,68,0.08)", borderLeft: "2px solid #C94444", color: "#E88080", fontSize: "12px", fontWeight: "300", marginBottom: "28px" }}>
            {message}
          </div>
        )}
        {success && (
          <div style={{ padding: "14px 20px", background: "rgba(76,201,128,0.08)", borderLeft: "2px solid #4CC980", color: "#80E8A8", fontSize: "12px", fontWeight: "300", marginBottom: "28px" }}>
            {t.accountCreated}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {[
            { label: t.fullName, name: "name", type: "text", placeholder: t.fullNamePlaceholder },
            { label: t.emailAddress, name: "email", type: "email", placeholder: t.emailPlaceholder },
            { label: t.password, name: "password", type: "password", placeholder: t.passwordPlaceholder },
          ].map(field => (
            <div key={field.name} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "9px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                onKeyDown={e => e.key === "Enter" && handleRegister()}
                style={{ background: "transparent", border: "none", borderBottom: `1px solid ${inputBorder}`, padding: "12px 0", color: inputColor, fontFamily: "Montserrat, sans-serif", fontSize: "14px", fontWeight: "300", outline: "none" }}
              />
            </div>
          ))}

          <button onClick={handleRegister} disabled={loading || success} style={{ padding: "18px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "4px", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading || success ? 0.5 : 1, marginTop: "10px" }}>
            {loading ? t.creatingAccount : t.createAccountBtn}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: grayColor, fontWeight: "300" }}>
          {t.alreadyMember}{" "}
          <Link to="/login" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: "500" }}>{t.signIn}</Link>
        </p>
      </div>
    </div>
  );
}
