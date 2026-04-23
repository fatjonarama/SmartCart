import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

function CountdownTimer({ createdAt, t }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const orderTime = new Date(createdAt).getTime();
      const arrivalTime = orderTime + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = arrivalTime - now;
      if (diff <= 0) { setArrived(true); setTimeLeft("00:00:00"); return; }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const orderTime = new Date(createdAt).getTime();
  const arrivalTime = orderTime + 24 * 60 * 60 * 1000;
  const now = Date.now();
  const progress = Math.min(((now - orderTime) / (arrivalTime - orderTime)) * 100, 100);

  if (arrived) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: "4px" }}>
        <span style={{ fontSize: "20px" }}>📦</span>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#4CAF50", textTransform: "uppercase", fontWeight: "600" }}>{t.orderArrived}</div>
          <div style={{ fontSize: "11px", color: "#888880", fontWeight: "300", marginTop: "2px" }}>{t.orderArrivedSub}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 20px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🚚</span>
          <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#C9A84C", textTransform: "uppercase", fontWeight: "600" }}>{t.arrivalCountdown}</span>
        </div>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: "300", color: "#C9A84C", letterSpacing: "2px", fontVariantNumeric: "tabular-nums" }}>
          {timeLeft}
        </div>
      </div>
      <div style={{ height: "3px", background: "rgba(201,168,76,0.15)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #C9A84C, #E8D5A3)", borderRadius: "2px", transition: "width 1s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        <span style={{ fontSize: "10px", color: "#888880", fontWeight: "300" }}>
          {new Date(createdAt).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit", hour12: false })} — {t.orderPlaced}
        </span>
        <span style={{ fontSize: "10px", color: "#888880", fontWeight: "300" }}>
          {new Date(arrivalTime).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit", hour12: false })} — {t.estimatedArrival}
        </span>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 768);

  const bg = isDark ? "#0A0A0A" : "#F5F5F0";
  const heroBg = isDark ? "#111111" : "#EBEBEB";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";
  const padding = isMobile ? "16px" : isTablet ? "24px" : "60px";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/v1/orders/my", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm(t.confirmCancel)) return;
    setCancellingId(orderId);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/v1/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // ✅ Shfaq si cancelled pastaj largo pas 5 minutash
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: "cancelled", cancelledAt: Date.now() } : o
      ));
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }, 5 * 60 * 1000);
    } catch (err) {
      alert(err.response?.data?.message || t.cancelError);
    }
    setCancellingId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return { bg: "rgba(255,193,7,0.12)", color: "#FFC107", border: "rgba(255,193,7,0.3)" };
      case "processing": return { bg: "rgba(33,150,243,0.12)", color: "#2196F3", border: "rgba(33,150,243,0.3)" };
      case "shipped": return { bg: "rgba(255,152,0,0.12)", color: "#FF9800", border: "rgba(255,152,0,0.3)" };
      case "delivered": return { bg: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "rgba(76,175,80,0.3)" };
      case "cancelled": return { bg: "rgba(244,67,54,0.12)", color: "#F44336", border: "rgba(244,67,54,0.3)" };
      default: return { bg: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "rgba(201,168,76,0.3)" };
    }
  };

  const getStatusLabel = (status) => ({
    pending: t.statusPending,
    processing: t.statusProcessing,
    shipped: t.statusShipped,
    delivered: t.statusDelivered,
    cancelled: t.statusCancelled,
  }[status] || status);

  const showCountdown = (order) => !["cancelled", "delivered"].includes(order.status);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "44px", height: "44px", border: "1px solid rgba(201,168,76,0.15)", borderTop: "1px solid #C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Montserrat, sans-serif", paddingTop: "80px", transition: "all 0.3s" }}>

      {/* HERO */}
      <div style={{ padding: `${isMobile ? "40px" : "60px"} ${padding} ${isMobile ? "24px" : "40px"}`, background: heroBg, borderBottom: `1px solid ${borderColor}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
        <div style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
          <span style={{ width: "30px", height: "1px", background: "#C9A84C", opacity: 0.5, display: "inline-block" }} />
          {user?.name}
        </div>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: isMobile ? "36px" : "clamp(36px, 5vw, 60px)", fontWeight: "300", color: textColor, lineHeight: "1", position: "relative", zIndex: 1, margin: 0 }}>
          {t.myOrdersTitle} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.myOrdersEm}</em>
        </h1>
        <p style={{ fontSize: "12px", color: grayColor, marginTop: "12px", fontWeight: "300", letterSpacing: "1px", position: "relative", zIndex: 1 }}>
          {orders.length === 0 ? t.noOrdersYet : `${orders.length} ${t.ordersTotal}`}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: `32px ${padding}` }}>
        {orders.length === 0 ? (
          <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px" }}>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "60px", color: "#C9A84C", opacity: 0.15 }}>◇</div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: "300", color: textColor, textAlign: "center" }}>{t.noOrdersYet}</h2>
            <p style={{ fontSize: "13px", color: grayColor, fontWeight: "300", textAlign: "center" }}>{t.noOrdersSub}</p>
            <button onClick={() => navigate("/products")} style={{ padding: "14px 40px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>
              {t.exploreProducts}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              const canCancel = ["pending", "processing"].includes(order.status);

              return (
                <div key={order.id} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "6px", overflow: "hidden", transition: "all 0.3s" }}>

                  {/* ORDER HEADER */}
                  <div style={{ padding: isMobile ? "16px" : "20px 28px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "20px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#C9A84C", textTransform: "uppercase", marginBottom: "4px" }}>{t.orderNumber}</div>
                        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "300", color: textColor }}>#{order.id}</div>
                      </div>
                      <div style={{ width: "1px", height: "40px", background: borderColor }} />
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "3px", color: grayColor, textTransform: "uppercase", marginBottom: "4px" }}>{t.orderDate}</div>
                        <div style={{ fontSize: "12px", color: textColor, fontWeight: "300" }}>
                          {new Date(order.created_at || order.createdAt).toLocaleDateString("sq-AL", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      </div>
                      <div style={{ width: "1px", height: "40px", background: borderColor }} />
                      <div>
                        <div style={{ fontSize: "10px", letterSpacing: "3px", color: grayColor, textTransform: "uppercase", marginBottom: "4px" }}>{t.orderTotal}</div>
                        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "300", color: "#C9A84C" }}>
                          €{parseFloat(order.total_price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* STATUS + CANCEL */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ padding: "6px 14px", borderRadius: "2px", background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: "11px", fontWeight: "500", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                        {getStatusLabel(order.status)}
                      </span>
                      {canCancel && (
                        <button onClick={() => handleCancel(order.id)} disabled={cancellingId === order.id}
                          style={{ padding: "6px 16px", background: "transparent", color: "#E57373", border: "1px solid rgba(229,115,115,0.3)", borderRadius: "2px", cursor: cancellingId === order.id ? "not-allowed" : "pointer", fontSize: "10px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", opacity: cancellingId === order.id ? 0.5 : 1, transition: "all 0.3s", whiteSpace: "nowrap" }}>
                          {cancellingId === order.id ? t.cancellingOrder : t.cancelOrder}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* COUNTDOWN */}
                  {showCountdown(order) && (
                    <div style={{ padding: isMobile ? "12px 16px" : "16px 28px", borderBottom: `1px solid ${borderColor}` }}>
                      <CountdownTimer createdAt={order.created_at || order.createdAt} t={t} />
                    </div>
                  )}

                  {/* ORDER ITEMS */}
                  <div style={{ padding: isMobile ? "12px 16px" : "16px 28px" }}>
                    {order.OrderItems && order.OrderItems.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {order.OrderItems.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "4px", background: "#1C1008", border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "14px", color: "rgba(255,255,255,0.2)" }}>{item.product_id}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: "12px", color: textColor, fontWeight: "400" }}>{t.productId}{item.product_id}</div>
                                <div style={{ fontSize: "11px", color: grayColor, fontWeight: "300" }}>{t.quantity2}: {item.quantity}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontWeight: "300", color: "#C9A84C", flexShrink: 0 }}>
                              €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: grayColor, fontStyle: "italic" }}>{t.noItemDetails}</div>
                    )}
                  </div>

                  {/* CANCELLED MESSAGE */}
                  {order.status === "cancelled" && (
                    <div style={{ padding: "12px 28px", background: "rgba(244,67,54,0.05)", borderTop: "1px solid rgba(244,67,54,0.1)" }}>
                      <span style={{ fontSize: "11px", color: "#F44336", fontWeight: "300" }}>{t.orderCancelled}</span>
                    </div>
                  )}

                  {/* DELIVERED MESSAGE */}
                  {order.status === "delivered" && (
                    <div style={{ padding: "12px 28px", background: "rgba(76,175,80,0.05)", borderTop: "1px solid rgba(76,175,80,0.1)" }}>
                      <span style={{ fontSize: "11px", color: "#4CAF50", fontWeight: "300" }}>{t.orderDelivered}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}