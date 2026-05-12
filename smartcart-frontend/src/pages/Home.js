import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [count, setCount] = useState({ products: 0, customers: 0, orders: 0 });

  const bg = isDark ? "#0A0A0A" : "#F5F5F0";
  const heroBg = isDark ? "#111111" : "#EBEBEB";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.3)";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";

  useEffect(() => {
    const targets = { products: 500, customers: 12000, orders: 48000 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        products: Math.floor(targets.products * ease),
        customers: Math.floor(targets.customers * ease),
        orders: Math.floor(targets.orders * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "Montserrat, sans-serif", color: textColor, overflowX: "hidden", transition: "all 0.3s" }}>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: bg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div style={{ textAlign: "center", zIndex: 2, padding: "40px 20px" }}>
          <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "6px", color: "#C9A84C", textTransform: "uppercase", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <span style={{ width: "40px", height: "1px", background: "#C9A84C", opacity: 0.6, display: "inline-block" }} />
            {t.heroEyebrow}
            <span style={{ width: "40px", height: "1px", background: "#C9A84C", opacity: 0.6, display: "inline-block" }} />
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(56px, 10vw, 120px)", fontWeight: "300", lineHeight: "0.9", color: textColor, marginBottom: "12px", letterSpacing: "-2px" }}>
            {t.heroTitle1} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.heroTitleEm}</em><br />{t.heroTitle2}
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(18px, 3vw, 28px)", fontWeight: "300", fontStyle: "italic", color: grayColor, marginBottom: "60px", letterSpacing: "1px" }}>
            {t.heroSub}
          </p>
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/products")} style={{ padding: "16px 48px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}>
              {t.exploreCollection}
            </button>
            <button onClick={() => navigate("/register")} style={{ padding: "16px 48px", background: "transparent", color: textColor, border: `1px solid ${borderColor}`, fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: "500", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}>
              {t.joinNow}
            </button>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: "18px 0", overflow: "hidden", background: heroBg }}>
        <div style={{ display: "flex", gap: "60px", animation: "marquee 20s linear infinite", whiteSpace: "nowrap" }}>
          <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          {[...t.marqueeItems, ...t.marqueeItems].map((item, i) => (
            <span key={i} style={{ fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", display: "flex", alignItems: "center", gap: "20px" }}>
              {item} <span style={{ width: "4px", height: "4px", background: "#C9A84C", borderRadius: "50%", opacity: 0.5, display: "inline-block" }} />
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section style={{ padding: "120px 60px", background: heroBg }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "20px", display: "block" }}>
            {t.whyChooseUs}
          </span>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: "300", color: textColor, lineHeight: "1.1" }}>
            {t.smartcartDiff} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.smartcartDiffEm}</em><br />{t.smartcartDiff2}
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2px", maxWidth: "1200px", margin: "0 auto" }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ background: cardBg, padding: "50px 40px", transition: "all 0.3s", cursor: "default", borderBottom: "2px solid transparent" }}
              onMouseEnter={e => { e.currentTarget.style.borderBottomColor = "#C9A84C"; e.currentTarget.style.background = isDark ? "#1E1E1E" : "#F0F0EB"; }}
              onMouseLeave={e => { e.currentTarget.style.borderBottomColor = "transparent"; e.currentTarget.style.background = cardBg; }}
            >
              <span style={{ fontSize: "32px", marginBottom: "28px", display: "block", color: "#C9A84C" }}>
                {["✦", "◈", "⟡", "◇"][i]}
              </span>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: "400", color: textColor, marginBottom: "16px" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", lineHeight: "1.8", color: grayColor, fontWeight: "300" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: bg, padding: "100px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2px", maxWidth: "1200px", margin: "0 auto" }}>
          {[
            { number: `${count.products.toLocaleString()}+`, label: t.premiumProducts },
            { number: `${(count.customers / 1000).toFixed(0)}K+`, label: t.happyCustomers },
            { number: `${(count.orders / 1000).toFixed(0)}K+`, label: t.ordersFulfilled },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "60px 40px", border: `1px solid ${borderColor}`, transition: "border-color 0.3s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}
            >
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "72px", fontWeight: "300", color: "#C9A84C", lineHeight: "1", marginBottom: "12px" }}>{s.number}</div>
              <div style={{ fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase", color: grayColor, fontWeight: "500" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section style={{ padding: "120px 60px", background: heroBg, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
        <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(40px, 6vw, 80px)", fontWeight: "300", color: textColor, marginBottom: "24px", position: "relative", zIndex: 1 }}>
          {t.readyToElevate} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.readyToElevateEm}</em><br />{t.readyToElevate2}
        </h2>
        <p style={{ fontSize: "14px", color: grayColor, marginBottom: "50px", fontWeight: "300", letterSpacing: "1px", position: "relative", zIndex: 1 }}>
          {t.readyToElevateSub}
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <button onClick={() => navigate("/products")} style={{ padding: "16px 48px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>
            {t.shopNow}
          </button>
          <button onClick={() => navigate("/register")} style={{ padding: "16px 48px", background: "transparent", color: textColor, border: `1px solid ${borderColor}`, fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: "500", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>
            {t.createAccount}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "60px", background: bg, borderTop: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: "300", color: "#C9A84C", letterSpacing: "4px", textTransform: "uppercase" }}>SmartCart</div>
        <div style={{ fontSize: "11px", color: grayColor, letterSpacing: "2px" }}>{t.footerCopy}</div>
      </footer>
    </div>
  );
}
