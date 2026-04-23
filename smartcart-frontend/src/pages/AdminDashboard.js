import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const bg = isDark ? "#0A0A0A" : "#F5F5F0";
  const cardBg = isDark ? "#111111" : "#FFFFFF";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";
  const rowEven = isDark ? "#111111" : "#FAFAFA";
  const rowOdd = isDark ? "#0A0A0A" : "#FFFFFF";
  const modalBg = isDark ? "#111111" : "#FFFFFF";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const padding = isMobile ? "16px" : isTablet ? "24px" : "40px";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/v1/stats/overview", { headers }),
        axios.get("http://localhost:5000/api/v1/users", { headers }),
        axios.get("http://localhost:5000/api/v1/products", { headers }),
        axios.get("http://localhost:5000/api/v1/orders", { headers }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      setOrders(ordersRes.data);
      toast.success(t.dataLoaded);
    } catch (err) {
      toast.error(t.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/users/${id}`, { headers });
      setUsers(users.filter((u) => u.id !== id));
      toast.success(t.userDeleted);
    } catch (err) { toast.error(t.errorDeleting); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/products/${id}`, { headers });
      setProducts(products.filter((p) => p.id !== id));
      toast.success(t.productDeleted);
    } catch (err) { toast.error(t.errorDeleting); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/v1/orders/${orderId}`, { status: newStatus }, { headers });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success("✅ Statusi u përditësua!");
    } catch (err) { toast.error("❌ Gabim gjatë përditësimit!"); }
  };

  const openEditProduct = (product) => {
    setSelectedItem(product);
    setFormData({ name: product.name || product.NAME, price: product.price, description: product.description || "", category: product.category || "", stock: product.stock });
    setModalType("editProduct");
    setShowModal(true);
  };

  const openAddProduct = () => {
    setFormData({ name: "", price: "", description: "", category: "", stock: 0 });
    setModalType("addProduct");
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setSelectedItem(null); setFormData({}); setModalType(null); };

  const handleSaveProduct = async () => {
    if (!formData.name || formData.name.length < 2) { toast.error("❌ " + t.nameLabel + " " + t.required + "!"); return; }
    if (!formData.price || formData.price <= 0) { toast.error("❌ " + t.priceLabel + " " + t.required + "!"); return; }
    try {
      if (modalType === "editProduct") {
        await axios.put(`http://localhost:5000/api/v1/products/${selectedItem.id}`, formData, { headers });
        setProducts(products.map((p) => p.id === selectedItem.id ? { ...p, ...formData } : p));
        toast.success(t.productUpdated);
      } else {
        const res = await axios.post("http://localhost:5000/api/v1/products", formData, { headers });
        setProducts([...products, res.data.data]);
        toast.success(t.productAdded);
      }
      closeModal();
    } catch (err) { toast.error(t.errorSaving); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return { color: "#FFC107", bg: "rgba(255,193,7,0.12)", border: "rgba(255,193,7,0.3)" };
      case "processing": return { color: "#2196F3", bg: "rgba(33,150,243,0.12)", border: "rgba(33,150,243,0.3)" };
      case "shipped": return { color: "#FF9800", bg: "rgba(255,152,0,0.12)", border: "rgba(255,152,0,0.3)" };
      case "delivered": return { color: "#4CAF50", bg: "rgba(76,175,80,0.12)", border: "rgba(76,175,80,0.3)" };
      case "cancelled": return { color: "#F44336", bg: "rgba(244,67,54,0.12)", border: "rgba(244,67,54,0.3)" };
      default: return { color: "#C9A84C", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)" };
    }
  };

  const thStyle = { padding: isMobile ? "8px 10px" : "12px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", borderBottom: `1px solid ${borderColor}`, whiteSpace: "nowrap" };
  const tdStyle = { padding: isMobile ? "8px 10px" : "12px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`, fontSize: isMobile ? "12px" : "13px", color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const tableStyle = { width: "100%", borderCollapse: "collapse", border: `1px solid ${borderColor}` };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#C9A84C", fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase" }}>{t.loadingData}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Montserrat, sans-serif", paddingTop: "80px", transition: "all 0.3s" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: `0 ${padding} 40px` }}>

        {/* HEADER */}
        <div style={{ marginBottom: "32px", borderBottom: `1px solid ${borderColor}`, paddingBottom: "20px", paddingTop: "24px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#C9A84C", marginBottom: "8px", textTransform: "uppercase" }}>{t.smartcartAdmin}</div>
          <h1 style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: "300", color: textColor, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{t.adminDashboard}</h1>
          <p style={{ color: grayColor, fontSize: "12px", marginTop: "8px" }}>
            {t.welcomeAdmin} <strong style={{ color: "#C9A84C" }}>{user?.name}</strong> — {t.role}: <strong style={{ color: "#C9A84C" }}>{user?.role}</strong>
          </p>
        </div>

        {/* STATS CARDS */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "12px" : "20px", marginBottom: "32px" }}>
            {[
              { label: t.users, value: stats.totalUsers, color: "#4CAF50", icon: "👥" },
              { label: t.productsLabel, value: stats.totalProducts, color: "#C9A84C", icon: "📦" },
              { label: t.orders, value: stats.totalOrders, color: "#FF9800", icon: "🛒" },
              { label: t.revenue, value: `€${Number(stats.totalRevenue).toFixed(2)}`, color: "#9C27B0", icon: "💰" },
            ].map((card, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderTop: `2px solid ${card.color}`, borderRadius: "4px", padding: isMobile ? "16px 12px" : "24px", textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? "20px" : "24px", marginBottom: "6px" }}>{card.icon}</div>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "6px" }}>{card.label}</div>
                <div style={{ fontSize: isMobile ? "22px" : "32px", fontWeight: "300", color: card.color, fontFamily: "Cormorant Garamond, serif" }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: `1px solid ${borderColor}`, overflowX: "auto" }}>
          {["overview", "orders", "users", "products"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: isMobile ? "10px 12px" : "12px 24px",
              background: activeTab === tab ? "rgba(201,168,76,0.1)" : "transparent",
              color: activeTab === tab ? "#C9A84C" : grayColor,
              border: "none", borderBottom: activeTab === tab ? "2px solid #C9A84C" : "2px solid transparent",
              cursor: "pointer", fontSize: "10px", letterSpacing: "2px",
              textTransform: "uppercase", fontFamily: "Montserrat, sans-serif",
              transition: "all 0.3s", whiteSpace: "nowrap", flexShrink: 0
            }}>
              {tab === "overview" ? `📊 ${isMobile ? "" : t.overview}`
                : tab === "orders" ? `🛒 ${isMobile ? "" : t.orders}`
                : tab === "users" ? `👥 ${isMobile ? "" : t.users}`
                : `📦 ${isMobile ? "" : t.productsLabel}`}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, marginBottom: "16px", fontFamily: "Cormorant Garamond, serif" }}>{t.ordersByStatus}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: cardBg }}><th style={thStyle}>{t.status}</th><th style={thStyle}>{t.count}</th></tr></thead>
                <tbody>
                  {stats.ordersByStatus.length === 0
                    ? <tr><td colSpan="2" style={{ ...tdStyle, textAlign: "center", color: grayColor }}>{t.noOrders}</td></tr>
                    : stats.ordersByStatus.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                        <td style={tdStyle}>{s.status}</td>
                        <td style={tdStyle}>{s.count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, margin: "24px 0 16px", fontFamily: "Cormorant Garamond, serif" }}>🏆 {t.top5}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: cardBg }}><th style={thStyle}>{t.productLabel}</th><th style={thStyle}>{t.totalSold}</th></tr></thead>
                <tbody>
                  {stats.topProducts.length === 0
                    ? <tr><td colSpan="2" style={{ ...tdStyle, textAlign: "center", color: grayColor }}>{t.noData}</td></tr>
                    : stats.topProducts.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{p.total_sold}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, marginBottom: "16px", fontFamily: "Cormorant Garamond, serif" }}>
              🛒 {t.orders} — {orders.length} gjithsej
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: cardBg }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>User ID</th>
                    <th style={thStyle}>Totali</th>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Statusi</th>
                    <th style={thStyle}>Ndrysho Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" style={{ ...tdStyle, textAlign: "center", color: grayColor }}>{t.noOrders}</td></tr>
                  ) : orders.map((o, i) => {
                    const sc = getStatusColor(o.status);
                    return (
                      <tr key={o.id} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                        <td style={tdStyle}>#{o.id}</td>
                        <td style={tdStyle}>User #{o.user_id}</td>
                        <td style={{ ...tdStyle, color: "#C9A84C" }}>€{parseFloat(o.total_price).toFixed(2)}</td>
                        <td style={tdStyle}>{new Date(o.created_at || o.createdAt).toLocaleDateString("sq-AL")}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: "3px 10px", borderRadius: "2px", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            style={{ background: inputBg, border: `1px solid ${borderColor}`, borderRadius: "2px", color: textColor, padding: "4px 8px", fontSize: "11px", fontFamily: "Montserrat, sans-serif", cursor: "pointer", outline: "none" }}
                          >
                            {["pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, marginBottom: "16px", fontFamily: "Cormorant Garamond, serif" }}>{t.manageUsers}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: cardBg }}>
                    {!isMobile && <th style={thStyle}>{t.id}</th>}
                    <th style={thStyle}>{t.name}</th>
                    {!isMobile && <th style={thStyle}>{t.email}</th>}
                    <th style={thStyle}>{t.roleLabel}</th>
                    <th style={thStyle}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                      {!isMobile && <td style={tdStyle}>{u.id}</td>}
                      <td style={tdStyle}>{u.name || u.NAME}</td>
                      {!isMobile && <td style={tdStyle}>{u.email}</td>}
                      <td style={tdStyle}>
                        <span style={{ padding: "3px 8px", borderRadius: "2px", background: u.role === "admin" ? "rgba(201,168,76,0.15)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: u.role === "admin" ? "#C9A84C" : grayColor, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", border: `1px solid ${u.role === "admin" ? "rgba(201,168,76,0.3)" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.id !== user?.id && (
                          <button onClick={() => deleteUser(u.id)} style={{ padding: isMobile ? "4px 10px" : "6px 16px", background: "transparent", color: "#E57373", border: "1px solid rgba(229,115,115,0.3)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap" }}>
                            {isMobile ? "✕" : t.delete}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, fontFamily: "Cormorant Garamond, serif", margin: 0 }}>{t.manageProducts}</h2>
              <button onClick={openAddProduct} style={{ padding: isMobile ? "8px 14px" : "10px 24px", background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap" }}>
                {isMobile ? "+" : t.addProduct}
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: cardBg }}>
                    {!isMobile && <th style={thStyle}>{t.id}</th>}
                    <th style={thStyle}>{t.nameLabel}</th>
                    <th style={thStyle}>{t.priceLabel}</th>
                    {!isMobile && <th style={thStyle}>{t.stockLabel}</th>}
                    {!isTablet && <th style={thStyle}>{t.categoryLabel}</th>}
                    <th style={thStyle}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                      {!isMobile && <td style={tdStyle}>{p.id}</td>}
                      <td style={{ ...tdStyle, maxWidth: isMobile ? "80px" : "160px" }}>{p.name || p.NAME}</td>
                      <td style={{ ...tdStyle, color: "#C9A84C", whiteSpace: "nowrap" }}>€{p.price}</td>
                      {!isMobile && <td style={tdStyle}>{p.stock}</td>}
                      {!isTablet && <td style={tdStyle}>{p.category || "—"}</td>}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => openEditProduct(p)} style={{ padding: isMobile ? "4px 8px" : "6px 14px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap" }}>
                            {isMobile ? "✏️" : t.edit}
                          </button>
                          <button onClick={() => deleteProduct(p.id)} style={{ padding: isMobile ? "4px 8px" : "6px 14px", background: "transparent", color: "#E57373", border: "1px solid rgba(229,115,115,0.3)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap" }}>
                            {isMobile ? "✕" : t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: modalBg, border: `1px solid ${borderColor}`, borderRadius: "4px", padding: isMobile ? "24px 20px" : "40px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "300", color: textColor, marginBottom: "20px", fontFamily: "Cormorant Garamond, serif", borderBottom: `1px solid ${borderColor}`, paddingBottom: "14px" }}>
              {modalType === "editProduct" ? t.editProduct : t.addNewProduct}
            </h2>
            {[
              { label: t.nameLabel, key: "name", type: "text", required: true },
              { label: t.priceLabel, key: "price", type: "number", required: true },
              { label: t.categoryLabel, key: "category", type: "text" },
              { label: t.stockLabel, key: "stock", type: "number" },
              { label: t.descriptionLabel, key: "description", type: "text" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "6px" }}>
                  {field.label} {field.required && <span style={{ color: "#C9A84C" }}>*</span>}
                </label>
                <input type={field.type} value={formData[field.key] || ""} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", background: inputBg, border: !formData[field.key] && field.required ? "1px solid rgba(229,115,115,0.5)" : `1px solid ${borderColor}`, borderRadius: "2px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
                {!formData[field.key] && field.required && (
                  <div style={{ color: "#E57373", fontSize: "11px", marginTop: "4px" }}>{field.label} {t.required}!</div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button onClick={handleSaveProduct} style={{ flex: 1, padding: "14px", background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
                {t.save}
              </button>
              <button onClick={closeModal} style={{ flex: 1, padding: "14px", background: "transparent", color: grayColor, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: "2px", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;