import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const cardColors = [
  "#1C1008", "#081C10", "#08101C", "#1C0808",
  "#0F0C18", "#181208", "#0C1818", "#180C18",
];

/* ═══════════════════════════════════════════
   PAYPAL MODAL — 3 hapa si real
═══════════════════════════════════════════ */
function PayPalModal({ cartTotal, onClose, onConfirm, isDark }) {
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const cardBg    = isDark ? "#1A1A2E"  : "#FFFFFF";
  const grayColor = isDark ? "#888880"  : "#666660";
  const inputBg   = isDark ? "rgba(255,255,255,0.06)" : "#F7F8FA";

  const [ppStep,    setPpStep]    = useState(1);
  const [ppEmail,   setPpEmail]   = useState("");
  const [ppPass,    setPpPass]    = useState("");
  const [ppLoading, setPpLoading] = useState(false);
  const [ppError,   setPpError]   = useState("");
  const [showPass,  setShowPass]  = useState(false);

  const ppNext = async () => {
    setPpError("");
    if (ppStep === 1) {
      if (!/\S+@\S+\.\S+/.test(ppEmail)) { setPpError("Please enter a valid email."); return; }
      setPpLoading(true);
      await new Promise(r => setTimeout(r, 1200));
      setPpLoading(false);
      setPpStep(2);
    } else if (ppStep === 2) {
      if (ppPass.length < 6) { setPpError("Password must be at least 6 characters."); return; }
      setPpLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setPpLoading(false);
      setPpStep(3);
    } else {
      onConfirm();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`
        @keyframes ppIn { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ppSlide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin2 { to{transform:rotate(360deg)} }
        .pp-inp:focus { outline:none; border-color:#0070BA !important; box-shadow:0 0 0 3px rgba(0,112,186,0.15); }
      `}</style>
      <div style={{ background: cardBg, borderRadius: "8px", width: "100%", maxWidth: "400px", overflow: "hidden", animation: "ppIn 0.3s ease", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        {/* Top bar */}
        <div style={{ background: "linear-gradient(135deg,#003087 0%,#0070BA 100%)", padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <span style={{ fontFamily: "Arial", fontSize: "26px", fontWeight: "800", color: "#009cde" }}>Pay</span>
              <span style={{ fontFamily: "Arial", fontSize: "26px", fontWeight: "800", color: "#fff" }}>Pal</span>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "16px" }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ height: "3px", flex: 1, borderRadius: "2px", background: s <= ppStep ? "#fff" : "rgba(255,255,255,0.3)", transition: "background 0.3s" }} />
            ))}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>
            Step {ppStep} of 3 — {ppStep === 1 ? "Email" : ppStep === 2 ? "Password" : "Confirm"}
          </div>
        </div>

        {/* Step 1 — Email */}
        {ppStep === 1 && (
          <div style={{ padding: "28px", animation: "ppSlide 0.25s ease" }}>
            <h3 style={{ fontFamily: "Arial", fontSize: "18px", fontWeight: "700", color: textColor, margin: "0 0 6px" }}>Log in to your account</h3>
            <p style={{ fontSize: "12px", color: grayColor, margin: "0 0 24px", lineHeight: "1.5" }}>Enter the email linked to your PayPal account.</p>
            <label style={{ display: "block", fontSize: "11px", color: grayColor, marginBottom: "6px", fontWeight: "500" }}>Email or phone number</label>
            <input className="pp-inp" type="email" value={ppEmail} onChange={e => setPpEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && ppNext()} placeholder="email@example.com" autoFocus
              style={{ width: "100%", padding: "13px 14px", background: inputBg, border: `1px solid ${ppError ? "#c0392b" : "#CBD5E0"}`, borderRadius: "6px", color: textColor, fontSize: "14px", boxSizing: "border-box", fontFamily: "Arial" }} />
            {ppError && <div style={{ fontSize: "11px", color: "#c0392b", marginTop: "6px" }}>⚠ {ppError}</div>}
            <button onClick={ppNext} disabled={ppLoading}
              style={{ width: "100%", marginTop: "18px", padding: "14px", background: ppLoading ? "#85C1E9" : "#0070BA", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "700", cursor: ppLoading ? "not-allowed" : "pointer", fontFamily: "Arial", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              {ppLoading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin2 0.8s linear infinite" }} />Verifying...</> : "Continue"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} /><span style={{ fontSize: "11px", color: grayColor }}>or</span><div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
            </div>
            <button style={{ width: "100%", padding: "13px", background: "transparent", color: "#0070BA", border: "2px solid #0070BA", borderRadius: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "Arial" }}>Create account</button>
            <p style={{ fontSize: "10px", color: grayColor, textAlign: "center", marginTop: "16px", lineHeight: "1.6" }}>🔒 Your data is encrypted and secure. PayPal never shares your financial information with merchants.</p>
          </div>
        )}

        {/* Step 2 — Password */}
        {ppStep === 2 && (
          <div style={{ padding: "28px", animation: "ppSlide 0.25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", padding: "14px 16px", background: isDark ? "rgba(0,112,186,0.1)" : "#EBF8FF", borderRadius: "8px", border: "1px solid rgba(0,112,186,0.2)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#0070BA,#003087)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>
                {ppEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: textColor }}>{ppEmail}</div>
                <button onClick={() => { setPpStep(1); setPpPass(""); setPpError(""); }} style={{ fontSize: "11px", color: "#0070BA", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "Arial" }}>Not you? Change</button>
              </div>
            </div>
            <label style={{ display: "block", fontSize: "11px", color: grayColor, marginBottom: "6px", fontWeight: "500" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input className="pp-inp" type={showPass ? "text" : "password"} value={ppPass} onChange={e => setPpPass(e.target.value)} onKeyDown={e => e.key === "Enter" && ppNext()} placeholder="••••••••" autoFocus
                style={{ width: "100%", padding: "13px 44px 13px 14px", background: inputBg, border: `1px solid ${ppError ? "#c0392b" : "#CBD5E0"}`, borderRadius: "6px", color: textColor, fontSize: "14px", boxSizing: "border-box", fontFamily: "Arial" }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: grayColor }}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {ppError && <div style={{ fontSize: "11px", color: "#c0392b", marginTop: "6px" }}>⚠ {ppError}</div>}
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button style={{ fontSize: "12px", color: "#0070BA", background: "none", border: "none", cursor: "pointer", fontFamily: "Arial" }}>Forgot password?</button>
            </div>
            <button onClick={ppNext} disabled={ppLoading}
              style={{ width: "100%", marginTop: "18px", padding: "14px", background: ppLoading ? "#85C1E9" : "#0070BA", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "700", cursor: ppLoading ? "not-allowed" : "pointer", fontFamily: "Arial", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              {ppLoading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin2 0.8s linear infinite" }} />Authenticating...</> : "Log In"}
            </button>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {ppStep === 3 && (
          <div style={{ padding: "28px", animation: "ppSlide 0.25s ease" }}>
            <h3 style={{ fontFamily: "Arial", fontSize: "18px", fontWeight: "700", color: textColor, margin: "0 0 6px" }}>Confirm Payment</h3>
            <p style={{ fontSize: "12px", color: grayColor, margin: "0 0 20px" }}>Review transaction details before confirming.</p>
            <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#F7F8FA", borderRadius: "8px", padding: "16px", marginBottom: "16px", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}` }}>
              {[
                { label: "PayPal Account", value: ppEmail },
                { label: "Merchant", value: "SmartCart Store" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "12px" }}>
                  <span style={{ color: grayColor }}>{row.label}</span>
                  <span style={{ color: textColor, fontWeight: "500" }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: grayColor, fontWeight: "600" }}>Total</span>
                <span style={{ fontSize: "24px", fontWeight: "700", color: "#0070BA", fontFamily: "Arial" }}>€{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: isDark ? "rgba(0,112,186,0.08)" : "#EBF8FF", borderRadius: "6px", marginBottom: "18px", border: "1px solid rgba(0,112,186,0.2)" }}>
              <span style={{ fontSize: "18px" }}>💼</span>
              <div>
                <div style={{ fontSize: "11px", color: grayColor }}>PayPal Balance</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: textColor }}>€{(cartTotal + 120.50).toFixed(2)} available</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 14px", background: isDark ? "rgba(76,175,80,0.06)" : "#F0FFF4", borderRadius: "6px", marginBottom: "20px", border: "1px solid rgba(76,175,80,0.2)" }}>
              <span style={{ fontSize: "14px", marginTop: "1px" }}>🛡️</span>
              <p style={{ fontSize: "10px", color: grayColor, margin: 0, lineHeight: "1.6" }}>
                This payment is protected by <strong style={{ color: "#0070BA" }}>PayPal Buyer Protection</strong>.
              </p>
            </div>
            <button onClick={ppNext}
              style={{ width: "100%", padding: "15px", background: "#F5A623", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "Arial", boxShadow: "0 4px 12px rgba(245,166,35,0.4)" }}>
              Pay €{cartTotal.toFixed(2)}
            </button>
            <p style={{ fontSize: "10px", color: grayColor, textAlign: "center", marginTop: "12px", lineHeight: "1.6" }}>
              By clicking "Pay", you agree to PayPal's <span style={{ color: "#0070BA" }}>Terms of Service</span> and <span style={{ color: "#0070BA" }}>Privacy Policy</span>.
            </p>
          </div>
        )}

        <div style={{ padding: "12px 28px 16px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          {["🔒 SSL", "🛡️ Buyer Protection", "🏦 PCI DSS"].map((item, i) => (
            <div key={i} style={{ fontSize: "9px", color: grayColor }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAYMENT MODAL — Kryesor
═══════════════════════════════════════════ */
function PaymentModal({ cartTotal, cart, onClose, onSuccess, isDark }) {
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const cardBg      = isDark ? "#111111"  : "#FFFFFF";
  const grayColor   = isDark ? "#888880"  : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.3)";
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const [method,     setMethod]     = useState(null); // "cash"|"card"|"paypal"
  const [step,       setStep]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});
  const [showPayPal, setShowPayPal] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName,   setCardName]   = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");

  const formatCard   = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = v => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };
  const cardBrand    = () => {
    const n = cardNumber.replace(/\s/g,"");
    if (/^4/.test(n))      return { name: "VISA",       color: "#1A1F71" };
    if (/^5[1-5]/.test(n)) return { name: "MASTERCARD", color: "#EB001B" };
    if (/^3[47]/.test(n))  return { name: "AMEX",       color: "#007BC1" };
    return null;
  };

  const validate = () => {
    const e = {};
    if (method === "card") {
      if (cardNumber.replace(/\s/g,"").length < 16) e.cardNumber = "Card number must be 16 digits.";
      if (!cardName.trim()) e.cardName = "Name on card is required.";
      if (expiry.length < 5) e.expiry = "Invalid expiry date.";
      if (cvv.length < 3)    e.cvv    = "CVV must be 3-4 digits.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("https://smartcart-ks.up.railway.app/api/v1/orders", {
        total_price: cartTotal.toFixed(2),
        payment_method: method,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price })),
      }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      onSuccess();
    } catch {
      setErrors({ server: "An error occurred. Please try again." });
    }
    setLoading(false);
  };

  const handlePayPalConfirm = async () => {
    setShowPayPal(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("https://smartcart-ks.up.railway.app/api/v1/orders", {
        total_price: cartTotal.toFixed(2),
        payment_method: "paypal",
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price })),
      }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      onSuccess();
    } catch {
      setErrors({ server: "An error occurred. Please try again." });
    }
    setLoading(false);
  };

  const brand = cardBrand();

  return (
    <>
      {showPayPal && <PayPalModal cartTotal={cartTotal} isDark={isDark} onClose={() => setShowPayPal(false)} onConfirm={handlePayPalConfirm} />}

      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <style>{`
          @keyframes modalIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes cardFlip { from{opacity:0;transform:rotateY(20deg) scale(0.97)} to{opacity:1;transform:rotateY(0) scale(1)} }
          @keyframes spin { to{transform:rotate(360deg)} }
          .pay-input { transition: border-color 0.2s; }
          .pay-input:focus { outline:none; border-color: rgba(201,168,76,0.6) !important; }
          .method-card { transition: all 0.2s; cursor: pointer; }
          .method-card:hover { border-color: rgba(201,168,76,0.5) !important; background: rgba(201,168,76,0.04) !important; transform: translateY(-1px); }
        `}</style>

        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "12px", width: "100%", maxWidth: "500px", overflow: "hidden", animation: "modalIn 0.3s ease", maxHeight: "92vh", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ padding: "28px 32px 24px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#C9A84C", textTransform: "uppercase", marginBottom: "6px" }}>
                {step === 1 ? "Payment Method" : method === "cash" ? "Cash on Delivery" : "Credit / Debit Card"}
              </div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: "300", color: textColor }}>
                Total: <span style={{ color: "#C9A84C" }}>€{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: grayColor, cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>✕</button>
          </div>

          {/* STEP 1 — Choose method */}
          {step === 1 && (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "11px", color: grayColor, margin: "0 0 6px", fontWeight: "300" }}>Choose your payment method to continue.</p>

              {/* CASH */}
              <div className="method-card" onClick={() => { setMethod("cash"); setStep(2); }}
                style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px 22px", border: `1px solid ${borderColor}`, borderRadius: "8px", background: "transparent" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>💵</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: textColor, marginBottom: "3px" }}>Cash on Delivery</div>
                  <div style={{ fontSize: "11px", color: grayColor, fontWeight: "300" }}>Pay when your product arrives at your door</div>
                </div>
                <div style={{ fontSize: "10px", color: "#4CAF50", fontWeight: "600", letterSpacing: "1px" }}>FREE</div>
              </div>

              {/* CARD */}
              <div className="method-card" onClick={() => { setMethod("card"); setStep(2); }}
                style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px 22px", border: `1px solid ${borderColor}`, borderRadius: "8px", background: "transparent" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>💳</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: textColor, marginBottom: "3px" }}>Credit / Debit Card</div>
                  <div style={{ fontSize: "11px", color: grayColor, fontWeight: "300" }}>Visa · Mastercard · American Express</div>
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[["V","#1A1F71"],["M","#EB001B"],["A","#007BC1"]].map(([l,c],i) => (
                    <div key={i} style={{ width: "22px", height: "15px", borderRadius: "3px", background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#fff", fontWeight: "800" }}>{l}</div>
                  ))}
                </div>
              </div>

              {/* PAYPAL */}
              <div className="method-card" onClick={() => setShowPayPal(true)}
                style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px 22px", border: `1px solid ${borderColor}`, borderRadius: "8px", background: "transparent" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "rgba(0,112,186,0.1)", border: "1px solid rgba(0,112,186,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "Arial", fontSize: "11px", fontWeight: "800", color: "#003087" }}>Pay</span>
                  <span style={{ fontFamily: "Arial", fontSize: "11px", fontWeight: "800", color: "#009cde" }}>Pal</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: textColor, marginBottom: "3px" }}>PayPal</div>
                  <div style={{ fontSize: "11px", color: grayColor, fontWeight: "300" }}>Log in to your PayPal account — fast and secure</div>
                </div>
                <div style={{ fontSize: "10px", color: "#0070BA", fontWeight: "600", padding: "3px 8px", border: "1px solid rgba(0,112,186,0.3)", borderRadius: "4px" }}>RECOMMENDED</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "12px" }}>🔒</span>
                <span style={{ fontSize: "10px", color: grayColor, fontWeight: "300" }}>Secured with SSL 256-bit encryption · PCI DSS Compliant</span>
              </div>
            </div>
          )}

          {/* STEP 2 — Cash */}
          {step === 2 && method === "cash" && (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "18px", animation: "cardFlip 0.3s ease" }}>
              <div style={{ padding: "20px 22px", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#4CAF50", marginBottom: "12px" }}>✅ Cash on Delivery — Confirmation</div>
                {[
                  { label: "Method", value: "Cash on Delivery" },
                  { label: "Total to pay", value: `€${cartTotal.toFixed(2)}` },
                  { label: "Estimated arrival", value: "Within 24 hours" },
                  { label: "Delivery fee", value: "Free" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 3 ? "1px solid rgba(76,175,80,0.1)" : "none", fontSize: "12px" }}>
                    <span style={{ color: grayColor }}>{row.label}</span>
                    <span style={{ color: textColor, fontWeight: "500" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "6px", fontSize: "11px", color: grayColor, lineHeight: "1.7" }}>
                ℹ️ Your order will be confirmed immediately. The courier will arrive with the product and you pay directly to them.
              </div>
              {errors.server && <div style={{ padding: "12px", background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: "4px", color: "#F44336", fontSize: "11px" }}>{errors.server}</div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", background: "transparent", color: grayColor, border: `1px solid ${borderColor}`, borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>← Back</button>
                <button onClick={handlePay} disabled={loading}
                  style={{ flex: 2, padding: "13px", background: loading ? "rgba(76,175,80,0.4)" : "#4CAF50", color: "#fff", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</> : "✅ Confirm Order"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Card */}
          {step === 2 && method === "card" && (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "16px", animation: "cardFlip 0.3s ease" }}>
              {/* Card Preview */}
              <div style={{ background: `linear-gradient(135deg, ${brand ? brand.color : "#1A1A2E"} 0%, #0A0A1E 100%)`, borderRadius: "12px", padding: "22px", position: "relative", overflow: "hidden", minHeight: "145px" }}>
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ position: "absolute", bottom: "-30px", left: "20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div style={{ width: "38px", height: "26px", background: "rgba(255,215,0,0.8)", borderRadius: "4px" }} />
                  {brand && <div style={{ fontSize: "11px", fontWeight: "700", color: "#fff", letterSpacing: "2px" }}>{brand.name}</div>}
                </div>
                <div style={{ fontFamily: "Courier New, monospace", fontSize: "17px", color: "#fff", letterSpacing: "3px", marginBottom: "14px" }}>{cardNumber || "•••• •••• •••• ••••"}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "2px" }}>NAME</div>
                    <div style={{ fontSize: "11px", color: "#fff", fontWeight: "500" }}>{cardName || "FULL NAME"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "2px" }}>EXPIRES</div>
                    <div style={{ fontSize: "11px", color: "#fff", fontWeight: "500" }}>{expiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              {[
                { label: "Card Number", value: cardNumber, onChange: e => setCardNumber(formatCard(e.target.value)), placeholder: "1234 5678 9012 3456", error: errors.cardNumber, maxLen: 19 },
                { label: "Name on Card", value: cardName, onChange: e => setCardName(e.target.value.toUpperCase()), placeholder: "FULL NAME", error: errors.cardName },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "5px" }}>{f.label}</label>
                  <input className="pay-input" type="text" value={f.value} onChange={f.onChange} placeholder={f.placeholder} maxLength={f.maxLen}
                    style={{ width: "100%", padding: "12px 14px", background: inputBg, border: `1px solid ${f.error ? "rgba(244,67,54,0.5)" : borderColor}`, borderRadius: "4px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", boxSizing: "border-box" }} />
                  {f.error && <div style={{ fontSize: "10px", color: "#F44336", marginTop: "3px" }}>{f.error}</div>}
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "5px" }}>Expiry Date</label>
                  <input className="pay-input" type="text" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5}
                    style={{ width: "100%", padding: "12px 14px", background: inputBg, border: `1px solid ${errors.expiry ? "rgba(244,67,54,0.5)" : borderColor}`, borderRadius: "4px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", boxSizing: "border-box" }} />
                  {errors.expiry && <div style={{ fontSize: "10px", color: "#F44336", marginTop: "3px" }}>{errors.expiry}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "5px" }}>CVV</label>
                  <input className="pay-input" type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" maxLength={4}
                    style={{ width: "100%", padding: "12px 14px", background: inputBg, border: `1px solid ${errors.cvv ? "rgba(244,67,54,0.5)" : borderColor}`, borderRadius: "4px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", boxSizing: "border-box" }} />
                  {errors.cvv && <div style={{ fontSize: "10px", color: "#F44336", marginTop: "3px" }}>{errors.cvv}</div>}
                </div>
              </div>

              {errors.server && <div style={{ padding: "12px", background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: "4px", color: "#F44336", fontSize: "11px" }}>{errors.server}</div>}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(33,150,243,0.05)", border: "1px solid rgba(33,150,243,0.15)", borderRadius: "4px" }}>
                <span>🔒</span>
                <span style={{ fontSize: "10px", color: grayColor }}>Card data is encrypted with SSL 256-bit. We never store your CVV.</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", background: "transparent", color: grayColor, border: `1px solid ${borderColor}`, borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>← Back</button>
                <button onClick={handlePay} disabled={loading}
                  style={{ flex: 2, padding: "13px", background: loading ? "rgba(201,168,76,0.4)" : "#C9A84C", color: "#0A0A0A", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #0A0A0A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</> : `💳 Pay €${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN CART
═══════════════════════════════════════════ */
export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { isDark }          = useTheme();
  const { t }               = useLanguage();
  const [status,      setStatus]      = useState("idle");
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const heroBg      = isDark ? "#111111" : "#EBEBEB";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";

  const handleCheckoutClick = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setShowPayment(false);
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", textAlign: "center", padding: "60px" }}>
        <div style={{ width: "100px", height: "100px", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", color: "#C9A84C" }}>✦</div>
        <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "48px", fontWeight: "300", color: textColor }}>
          {t.orderConfirmed} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.orderConfirmedEm}</em>
        </h2>
        <p style={{ fontSize: "13px", color: grayColor, fontWeight: "300", maxWidth: "400px", lineHeight: "1.8" }}>{t.orderConfirmedSub}</p>
        <button onClick={() => navigate("/products")} style={{ padding: "14px 40px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", marginTop: "8px" }}>
          {t.continueShoppingBtn}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Montserrat, sans-serif", color: textColor, paddingTop: "80px", transition: "all 0.3s" }}>
      {showPayment && <PaymentModal cartTotal={cartTotal} cart={cart} isDark={isDark} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />}

      {/* HERO */}
      <div style={{ padding: "60px 60px 40px", background: heroBg, borderBottom: `1px solid ${borderColor}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
        <div style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
          <span style={{ width: "30px", height: "1px", background: "#C9A84C", opacity: 0.5, display: "inline-block" }} />
          {t.yourSelection}
        </div>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: "300", color: textColor, lineHeight: "1", position: "relative", zIndex: 1, margin: 0 }}>{t.shoppingCart}</h1>
        <p style={{ fontSize: "12px", color: grayColor, marginTop: "12px", fontWeight: "300", letterSpacing: "1px", position: "relative", zIndex: 1 }}>
          {cart.length === 0 ? t.cartEmpty : `${cart.length} ${cart.length > 1 ? t.items : t.item} ${t.selected}`}
        </p>
      </div>

      {cart.length === 0 ? (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "60px" }}>
          <div style={{ fontSize: "48px", color: "#C9A84C", opacity: 0.2, fontFamily: "Cormorant Garamond, serif" }}>◇</div>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: "300", color: textColor }}>{t.cartEmpty}</h2>
          <p style={{ fontSize: "13px", color: grayColor, fontWeight: "300" }}>{t.cartEmptySub}</p>
          <button onClick={() => navigate("/products")} style={{ padding: "14px 40px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", marginTop: "8px" }}>
            {t.exploreCollection2}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px", alignItems: "start" }}>

          {/* ITEMS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {cart.map((item, i) => (
              <div key={item.id}
                style={{ background: cardBg, padding: "24px 28px", display: "flex", alignItems: "center", gap: "20px", transition: "background 0.3s", borderLeft: "2px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? "#1A1A1A" : "#F0F0EB"; e.currentTarget.style.borderLeftColor = "rgba(201,168,76,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = cardBg; e.currentTarget.style.borderLeftColor = "transparent"; }}
              >
                {/* ✅ Image ose placeholder */}
                <div style={{ width: "72px", height: "72px", flexShrink: 0, borderRadius: "4px", border: `1px solid ${borderColor}`, overflow: "hidden", backgroundColor: cardColors[i % cardColors.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: "300", color: "rgba(255,255,255,0.2)" }}>
                      {(item.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", fontWeight: "400", color: textColor, marginBottom: "6px" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: grayColor, fontWeight: "300" }}>€{parseFloat(item.price).toFixed(2)} {t.each}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "36px", height: "36px", background: "transparent", border: "none", color: "#C9A84C", fontSize: "18px", cursor: "pointer" }}>−</button>
                  <div style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: "500", color: textColor, borderLeft: "1px solid rgba(201,168,76,0.2)", borderRight: "1px solid rgba(201,168,76,0.2)", lineHeight: "36px" }}>{item.quantity}</div>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "36px", height: "36px", background: "transparent", border: "none", color: "#C9A84C", fontSize: "18px", cursor: "pointer" }}>+</button>
                </div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: "300", color: "#C9A84C", minWidth: "90px", textAlign: "right" }}>
                  €{(item.price * item.quantity).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: "transparent", border: "none", color: isDark ? "rgba(245,240,232,0.2)" : "rgba(0,0,0,0.2)", fontSize: "16px", cursor: "pointer", padding: "8px" }}>✕</button>
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, position: "sticky", top: "100px" }}>
            <div style={{ padding: "28px 32px", borderBottom: `1px solid ${borderColor}` }}>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: "300", color: textColor }}>{t.orderSummary}</div>
            </div>
            <div style={{ padding: "24px 32px" }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", fontSize: "12px", color: grayColor, fontWeight: "300" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ color: textColor }}>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ height: "1px", background: borderColor, margin: "20px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: grayColor, fontWeight: "500" }}>{t.total}</div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: "300", color: "#C9A84C" }}>€{cartTotal.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ padding: "0 32px 32px" }}>
              {/* Payment icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", justifyContent: "center" }}>
                {[["💵","Cash"],["💳","Card"],["PP","PayPal"]].map(([icon,label],i) => (
                  <div key={i} title={label} style={{ padding: "4px 8px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `1px solid ${borderColor}`, borderRadius: "4px", fontSize: i===2?"9px":"13px", color: i===2?"#0070BA":undefined, fontWeight: i===2?"700":undefined }}>
                    {icon}
                  </div>
                ))}
              </div>
              <button onClick={handleCheckoutClick}
                style={{ width: "100%", padding: "18px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "4px", textTransform: "uppercase", cursor: "pointer", marginBottom: "12px" }}>
                {t.proceedCheckout} →
              </button>
              <button onClick={() => navigate("/products")}
                style={{ width: "100%", padding: "14px", background: "transparent", color: grayColor, border: `1px solid ${isDark ? "rgba(245,240,232,0.1)" : "rgba(0,0,0,0.1)"}`, fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "500", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>
                {t.continueShopping}
              </button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
                <span style={{ fontSize: "11px" }}>🔒</span>
                <span style={{ fontSize: "10px", color: grayColor, fontWeight: "300" }}>Secured SSL · PCI DSS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
