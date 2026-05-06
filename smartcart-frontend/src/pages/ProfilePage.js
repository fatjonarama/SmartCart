import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { isDark }        = useTheme();
  const { t }             = useLanguage();
  const navigate          = useNavigate();

  const [activeTab,      setActiveTab]      = useState("profile");
  const [orders,         setOrders]         = useState([]);
  const [ordersLoading,  setOrdersLoading]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [name,           setName]           = useState(user?.name  || "");
  const [email,          setEmail]          = useState(user?.email || "");
  const [currentPass,    setCurrentPass]    = useState("");
  const [newPass,        setNewPass]        = useState("");
  const [confirmPass,    setConfirmPass]    = useState("");
  const [showPasses,     setShowPasses]     = useState({ current: false, new: false, confirm: false });

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const heroBg      = isDark ? "#111111" : "#EBEBEB";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  useEffect(() => {
    if (activeTab !== "orders") return;
    setOrdersLoading(true);
    axios.get("http://localhost:5000/api/v1/orders/my", { headers })
      .then(res => setOrders(res.data))
      .catch(() => toast.error("Error loading orders."))
      .finally(() => setOrdersLoading(false));
  }, [activeTab]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name is required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Invalid email."); return; }
    setSaving(true);
    try {
      const res = await axios.put("http://localhost:5000/api/v1/users/profile", { name, email }, { headers });
      if (setUser) setUser(res.data.user || { ...user, name, email });
      toast.success(t.profileUpdated || "✅ Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving.");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPass) { toast.error("Enter current password."); return; }
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { toast.error("Passwords do not match."); return; }
    setSaving(true);
    try {
      await axios.put("http://localhost:5000/api/v1/users/password", { currentPassword: currentPass, newPassword: newPass }, { headers });
      toast.success(t.passwordChanged || "✅ Password changed!");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect current password.");
    }
    setSaving(false);
  };

  const getStatusColor = (status) => {
    const map = { pending: "#FFC107", processing: "#2196F3", shipped: "#FF9800", delivered: "#4CAF50", cancelled: "#F44336", exchange: "#C9A84C", return: "#FF9800" };
    return map[status] || "#C9A84C";
  };

  const initials = (user?.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const inputStyle = { width: "100%", padding: "12px 14px", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: "4px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "6px" };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Montserrat, sans-serif", paddingTop: "80px", transition: "all 0.3s" }}>
      <style>{`.pp-input:focus { border-color: rgba(201,168,76,0.6) !important; outline: none; }`}</style>

      {/* HERO */}
      <div style={{ padding: "48px 60px 40px", background: heroBg, borderBottom: `1px solid ${borderColor}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "700", color: "#0A0A0A", fontFamily: "Cormorant Garamond, serif", flexShrink: 0, boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#C9A84C", marginBottom: "8px", textTransform: "uppercase" }}>
              {t.profileEyebrow || "My Profile"}
            </div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "300", color: textColor, margin: 0 }}>
              {user?.name || "User"}
            </h1>
            <p style={{ fontSize: "12px", color: grayColor, marginTop: "6px", fontWeight: "300" }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 60px" }}>

        {/* TABS */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "32px", borderBottom: `1px solid ${borderColor}`, overflowX: "auto" }}>
          {[
            { key: "profile",  label: t.tabProfile  || "👤 Profile" },
            { key: "security", label: t.tabSecurity || "🔒 Security" },
            { key: "orders",   label: t.tabOrders   || "📦 Orders" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: "12px 24px", background: activeTab === tab.key ? "rgba(201,168,76,0.1)" : "transparent", color: activeTab === tab.key ? "#C9A84C" : grayColor, border: "none", borderBottom: activeTab === tab.key ? "2px solid #C9A84C" : "2px solid transparent", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Profile */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "32px" }}>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "300", color: textColor, marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${borderColor}` }}>
                {t.personalInfo || "Personal Information"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>{t.fullNameLabel || "Full Name"} *</label>
                  <input className="pp-input" type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t.emailLabel || "Email"} *</label>
                  <input className="pp-input" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={labelStyle}>{t.roleReadonly || "Role"}</label>
                  <div style={{ padding: "12px 14px", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: "4px", fontSize: "13px", color: "#C9A84C", fontWeight: "500" }}>{user?.role || "user"}</div>
                </div>
                <div>
                  <label style={labelStyle}>{t.memberSince || "Member Since"}</label>
                  <div style={{ padding: "12px 14px", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: "4px", fontSize: "13px", color: grayColor }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={saving}
                style={{ padding: "14px 36px", background: saving ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#0A0A0A", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
                {saving ? (t.saving || "Saving...") : (t.saveChanges || "Save Changes")}
              </button>
            </div>

            <div style={{ background: cardBg, border: "1px solid rgba(244,67,54,0.2)", borderRadius: "8px", padding: "24px 32px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#F44336", marginBottom: "8px" }}>{t.dangerZone || "⚠️ Danger Zone"}</h3>
              <p style={{ fontSize: "12px", color: grayColor, fontWeight: "300", marginBottom: "16px", lineHeight: "1.6" }}>
                {t.dangerZoneDesc || "Deleting your account is irreversible."}
              </p>
              <button onClick={() => toast.info("Contact administrator to delete account.")}
                style={{ padding: "10px 24px", background: "transparent", color: "#F44336", border: "1px solid rgba(244,67,54,0.4)", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
                {t.deleteAccount || "Delete Account"}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Security */}
        {activeTab === "security" && (
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "8px", padding: "32px" }}>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "300", color: textColor, marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${borderColor}` }}>
              {t.changePassword || "Change Password"}
            </h2>
            {[
              { label: t.currentPassword || "Current Password", value: currentPass, set: setCurrentPass, key: "current" },
              { label: t.newPassword     || "New Password",     value: newPass,     set: setNewPass,     key: "new" },
              { label: t.confirmPassword || "Confirm Password", value: confirmPass, set: setConfirmPass, key: "confirm" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input className="pp-input" type={showPasses[f.key] ? "text" : "password"} value={f.value} onChange={e => f.set(e.target.value)} placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: "44px" }} />
                  <button onClick={() => setShowPasses(p => ({ ...p, [f.key]: !p[f.key] }))}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: grayColor }}>
                    {showPasses[f.key] ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}

            {newPass && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "10px", color: grayColor, marginBottom: "6px", letterSpacing: "1px" }}>{(t.passwordStrength || "Password Strength").toUpperCase()}</div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= Math.min(4, Math.floor(newPass.length / 3)) ? (newPass.length < 6 ? "#F44336" : newPass.length < 9 ? "#FFC107" : "#4CAF50") : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"), transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ fontSize: "10px", marginTop: "4px", color: newPass.length < 6 ? "#F44336" : newPass.length < 9 ? "#FFC107" : "#4CAF50" }}>
                  {newPass.length < 6 ? (t.tooShort || "Too short") : newPass.length < 9 ? (t.medium || "Medium") : (t.strong || "Strong")}
                </div>
              </div>
            )}

         <div style={{ padding: "12px 16px", background: "rgba(33,150,243,0.05)", border: "1px solid rgba(33,150,243,0.15)", borderRadius: "4px", marginBottom: "16px" }}>
  <p style={{ fontSize: "11px", color: "#2196F3", margin: 0, lineHeight: "1.6" }}>
    🔒 Password is stored encrypted (bcrypt). Minimum 8 characters recommended.
  </p>
</div>

<div style={{ marginBottom: "24px" }}>
  <p style={{ fontSize: "12px", color: grayColor, fontWeight: "300", margin: 0 }}>
    Don't remember your current password?{" "}
    <span
      onClick={() => navigate("/forgot-password")}
      style={{ color: "#C9A84C", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
    >
      Reset it here
    </span>
  </p>
</div>

            <button onClick={handleChangePassword} disabled={saving}
              style={{ padding: "14px 36px", background: saving ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#0A0A0A", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
              {saving ? (t.changing || "Changing...") : (t.changePasswordBtn || "Change Password")}
            </button>
          </div>
        )}

        {/* TAB: Orders */}
        {activeTab === "orders" && (
          <div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "300", color: textColor, marginBottom: "20px" }}>
              {t.orderHistory || "Order History"} ({orders.length})
            </h2>
            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#C9A84C", letterSpacing: "3px", fontSize: "12px" }}>
                {t.loadingData || "Loading..."}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: grayColor }}>
                <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.2 }}>◇</div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: "300" }}>
                  {t.noOrdersProfile || "No orders yet"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "6px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#C9A84C", marginBottom: "4px" }}>{(t.orderNumber || "ORDER").toUpperCase()}</div>
                        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", fontWeight: "300", color: textColor }}>#{order.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "2px", color: grayColor, marginBottom: "4px" }}>{(t.orderTotal || "TOTAL").toUpperCase()}</div>
                        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "#C9A84C" }}>€{parseFloat(order.total_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "2px", color: grayColor, marginBottom: "4px" }}>{(t.orderDate || "DATE").toUpperCase()}</div>
                        <div style={{ fontSize: "12px", color: textColor }}>{new Date(order.created_at || order.createdAt).toLocaleDateString()}</div>
                      </div>
                      {order.payment_method && (
                        <div>
                          <div style={{ fontSize: "10px", letterSpacing: "2px", color: grayColor, marginBottom: "4px" }}>{(t.paymentMethod || "PAYMENT").toUpperCase()}</div>
                          <div style={{ fontSize: "12px", color: textColor, textTransform: "capitalize" }}>{order.payment_method}</div>
                        </div>
                      )}
                    </div>
                    <span style={{ padding: "6px 14px", borderRadius: "2px", background: `${getStatusColor(order.status)}18`, color: getStatusColor(order.status), border: `1px solid ${getStatusColor(order.status)}44`, fontSize: "10px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}