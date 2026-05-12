import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [returns,  setReturns]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [showModal,    setShowModal]    = useState(false);
  const [modalType,    setModalType]    = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData,     setFormData]     = useState({});
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef(null);

  const [showUserModal,  setShowUserModal]  = useState(false);
  const [userForm,       setUserForm]       = useState({ name: "", email: "", password: "", role: "user" });
  const [userFormErrors, setUserFormErrors] = useState({});
  const [savingUser,     setSavingUser]     = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => { setIsMobile(window.innerWidth <= 480); setIsTablet(window.innerWidth <= 768); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";
  const rowEven     = isDark ? "#111111" : "#FAFAFA";
  const rowOdd      = isDark ? "#0A0A0A" : "#FFFFFF";
  const modalBg     = isDark ? "#111111" : "#FFFFFF";
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const padding     = isMobile ? "16px" : isTablet ? "24px" : "40px";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, productsRes, ordersRes, returnsRes] = await Promise.all([
        axios.get("https://smartcart-ks.up.railway.app/api/v1/stats/overview", { headers }),
        axios.get("https://smartcart-ks.up.railway.app/api/v1/users", { headers }),
        axios.get("https://smartcart-ks.up.railway.app/api/v1/products", { headers }),
        axios.get("https://smartcart-ks.up.railway.app/api/v1/orders", { headers }),
        axios.get("https://smartcart-ks.up.railway.app/api/v1/orders/returns/all", { headers }),
      ]);
      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || usersRes.data.data || []);
      setProducts(productsRes.data.data || productsRes.data);
      setOrders(ordersRes.data);
      setReturns(Array.isArray(returnsRes.data) ? returnsRes.data : []);
      toast.success(t.dataLoaded);
    } catch { toast.error(t.errorLoading); }
    finally { setLoading(false); }
  };

  const handleResolveReturn = async (orderId, action, adminNote) => {
    try {
      await axios.patch(
        `https://smartcart-ks.up.railway.app/api/v1/orders/returns/${orderId}/resolve`,
        { action, admin_note: adminNote || "" },
        { headers }
      );
      setReturns(prev => prev.filter(r => r.id !== orderId));
      const msgs = {
        approve_refund:   "✅ Refund u aprovua!",
        approve_exchange: "🔄 Exchange u aprovua!",
        reject:           "❌ Kërkesa u refuzua."
      };
      toast.success(msgs[action]);
    } catch (err) { toast.error(err.response?.data?.message || "❌ Gabim!"); }
  };

  const handleImageFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Vetëm JPEG, PNG, WebP lejohen!"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imazhi nuk mund të jetë më i madh se 5MB!"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const openEditProduct = (product) => {
    setSelectedItem(product);
    setFormData({ name: product.name || product.NAME, price: product.price, description: product.description || "", category: product.category || "", stock: product.stock });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setModalType("editProduct");
    setShowModal(true);
  };

  const openAddProduct = () => {
    setFormData({ name: "", price: "", description: "", category: "", stock: 0 });
    setImageFile(null);
    setImagePreview(null);
    setModalType("addProduct");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setSelectedItem(null); setFormData({});
    setModalType(null); setImageFile(null); setImagePreview(null);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || formData.name.length < 2) { toast.error("❌ " + t.nameLabel + " " + t.required + "!"); return; }
    if (!formData.price || formData.price <= 0)      { toast.error("❌ " + t.priceLabel + " " + t.required + "!"); return; }
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, v); });
      if (imageFile) fd.append("image", imageFile);
      const multiHeaders = { ...headers, "Content-Type": "multipart/form-data" };
      if (modalType === "editProduct") {
        const res = await axios.put(`https://smartcart-ks.up.railway.app/api/v1/products/${selectedItem.id}`, fd, { headers: multiHeaders });
        const updated = res.data.data || { ...selectedItem, ...formData, image_url: imagePreview };
        setProducts(products.map(p => p.id === selectedItem.id ? { ...p, ...updated } : p));
        toast.success(t.productUpdated);
      } else {
        const res = await axios.post("https://smartcart-ks.up.railway.app/api/v1/products", fd, { headers: multiHeaders });
        setProducts([...products, res.data.data]);
        toast.success(t.productAdded);
      }
      closeModal();
    } catch { toast.error(t.errorSaving); }
  };

  const handleAddUser = async () => {
    const errors = {};
    if (!userForm.name.trim() || userForm.name.length < 2) errors.name = "Name must be at least 2 characters.";
    if (!/\S+@\S+\.\S+/.test(userForm.email)) errors.email = "Invalid email address.";
    if (userForm.password.length < 6) errors.password = "Password must be at least 6 characters.";
    setUserFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingUser(true);
    try {
      const res = await axios.post("https://smartcart-ks.up.railway.app/api/v1/users/register", userForm, { headers });
      const newUser = res.data.user || { id: Date.now(), ...userForm };
      setUsers(prev => [...prev, newUser]);
      setShowUserModal(false);
      setUserForm({ name: "", email: "", password: "", role: "user" });
      setUserFormErrors({});
      toast.success("✅ User u krijua me sukses!");
    } catch (err) { toast.error(err.response?.data?.message || "❌ Gabim gjatë krijimit."); }
    setSavingUser(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`https://smartcart-ks.up.railway.app/api/v1/users/${id}`, { headers });
      setUsers(users.filter(u => u.id !== id));
      toast.success(t.userDeleted);
    } catch { toast.error(t.errorDeleting); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await axios.delete(`https://smartcart-ks.up.railway.app/api/v1/products/${id}`, { headers });
      setProducts(products.filter(p => p.id !== id));
      toast.success(t.productDeleted);
    } catch { toast.error(t.errorDeleting); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`https://smartcart-ks.up.railway.app/api/v1/orders/${orderId}`, { status: newStatus }, { headers });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success("✅ Statusi u përditësua!");
    } catch { toast.error("❌ Gabim!"); }
  };

  const getStatusColor = (status) => {
    const map = {
      pending:          { color: "#FFC107", bg: "rgba(255,193,7,0.12)",  border: "rgba(255,193,7,0.3)"  },
      processing:       { color: "#2196F3", bg: "rgba(33,150,243,0.12)", border: "rgba(33,150,243,0.3)" },
      shipped:          { color: "#FF9800", bg: "rgba(255,152,0,0.12)",  border: "rgba(255,152,0,0.3)"  },
      delivered:        { color: "#4CAF50", bg: "rgba(76,175,80,0.12)",  border: "rgba(76,175,80,0.3)"  },
      cancelled:        { color: "#F44336", bg: "rgba(244,67,54,0.12)",  border: "rgba(244,67,54,0.3)"  },
      exchange:         { color: "#C9A84C", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)" },
      return:           { color: "#FF9800", bg: "rgba(255,152,0,0.12)",  border: "rgba(255,152,0,0.3)"  },
      return_requested: { color: "#FF5722", bg: "rgba(255,87,34,0.12)",  border: "rgba(255,87,34,0.3)"  },
      return_rejected:  { color: "#F44336", bg: "rgba(244,67,54,0.12)",  border: "rgba(244,67,54,0.3)"  },
      refunded:         { color: "#4CAF50", bg: "rgba(76,175,80,0.12)",  border: "rgba(76,175,80,0.3)"  },
    };
    return map[status] || { color: "#C9A84C", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)" };
  };

  const thStyle    = { padding: isMobile ? "8px 10px" : "12px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", borderBottom: `1px solid ${borderColor}`, whiteSpace: "nowrap" };
  const tdStyle    = { padding: isMobile ? "8px 10px" : "12px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`, fontSize: isMobile ? "12px" : "13px", color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const tableStyle = { width: "100%", borderCollapse: "collapse", border: `1px solid ${borderColor}` };
  const inputStyle = { width: "100%", padding: "10px 14px", background: inputBg, border: `1px solid ${borderColor}`, borderRadius: "2px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "6px" };

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

        {/* STATS */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? "12px" : "20px", marginBottom: "32px" }}>
            {[
              { label: t.users,         value: stats.totalUsers,                            color: "#4CAF50", icon: "👥" },
              { label: t.productsLabel, value: stats.totalProducts,                         color: "#C9A84C", icon: "📦" },
              { label: t.orders,        value: stats.totalOrders,                           color: "#FF9800", icon: "🛒" },
              { label: t.revenue,       value: `€${Number(stats.totalRevenue).toFixed(2)}`, color: "#9C27B0", icon: "💰" },
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
          {["overview","orders","users","products","returns"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: isMobile ? "10px 12px" : "12px 24px", background: activeTab === tab ? "rgba(201,168,76,0.1)" : "transparent", color: activeTab === tab ? "#C9A84C" : grayColor, border: "none", borderBottom: activeTab === tab ? "2px solid #C9A84C" : "2px solid transparent", cursor: "pointer", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", transition: "all 0.3s", whiteSpace: "nowrap", flexShrink: 0 }}>
              {tab === "overview" ? `📊 ${isMobile ? "" : t.overview}`
               : tab === "orders"  ? `🛒 ${isMobile ? "" : t.orders}`
               : tab === "users"   ? `👥 ${isMobile ? "" : t.users}`
               : tab === "returns" ? `↩ ${isMobile ? "" : "Returns"}${returns.length > 0 ? ` (${returns.length})` : ""}`
               : `📦 ${isMobile ? "" : t.productsLabel}`}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, marginBottom: "16px", fontFamily: "Cormorant Garamond, serif" }}>{t.ordersByStatus}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: cardBg }}><th style={thStyle}>{t.status}</th><th style={thStyle}>{t.count}</th></tr></thead>
                <tbody>{stats.ordersByStatus.map((s, i) => <tr key={i} style={{ background: i%2===0?rowEven:rowOdd }}><td style={tdStyle}>{s.status}</td><td style={tdStyle}>{s.count}</td></tr>)}</tbody>
              </table>
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, margin: "24px 0 16px", fontFamily: "Cormorant Garamond, serif" }}>🏆 {t.top5}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: cardBg }}><th style={thStyle}>{t.productLabel}</th><th style={thStyle}>{t.totalSold}</th></tr></thead>
                <tbody>{stats.topProducts.map((p, i) => <tr key={i} style={{ background: i%2===0?rowEven:rowOdd }}><td style={tdStyle}>{p.name}</td><td style={tdStyle}>{p.total_sold}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "300", color: textColor, marginBottom: "16px", fontFamily: "Cormorant Garamond, serif" }}>🛒 {t.orders} — {orders.length} gjithsej</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: cardBg }}><th style={thStyle}>ID</th><th style={thStyle}>Klienti</th><th style={thStyle}>Totali</th><th style={thStyle}>Pagesa</th><th style={thStyle}>Data</th><th style={thStyle}>Statusi</th><th style={thStyle}>Ndrysho</th></tr></thead>
                <tbody>
                  {orders.map((o, i) => {
                    const sc = getStatusColor(o.status);
                    const pmIcon = { cash:"💵", card:"💳", paypal:"🅿️" }[o.payment_method] || "—";
                    return (
                      <tr key={o.id} style={{ background: i%2===0?rowEven:rowOdd }}>
                        <td style={tdStyle}>#{o.id}</td>
                        <td style={{ ...tdStyle, whiteSpace:"nowrap" }}>
                          <div style={{ fontSize:"12px", fontWeight:"500" }}>{o.User?.name || `User #${o.user_id}`}</div>
                          {o.User?.email && <div style={{ fontSize:"10px", color:grayColor }}>{o.User.email}</div>}
                        </td>
                        <td style={{ ...tdStyle, color:"#C9A84C" }}>€{parseFloat(o.total_price).toFixed(2)}</td>
                        <td style={{ ...tdStyle, fontSize:"16px" }} title={o.payment_method}>{pmIcon}</td>
                        <td style={tdStyle}>{new Date(o.created_at||o.createdAt).toLocaleDateString("sq-AL")}</td>
                        <td style={tdStyle}>
                          <span style={{ padding:"3px 10px", borderRadius:"2px", background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                            {o.status==="exchange"?"⇄ Exchange":o.status==="return"?"↩ Return":o.status==="return_requested"?"↩ Return Req.":o.status==="return_rejected"?"✕ Rejected":o.status==="refunded"?"✅ Refunded":o.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                            style={{ background:inputBg, border:`1px solid ${borderColor}`, borderRadius:"2px", color:textColor, padding:"4px 8px", fontSize:"11px", fontFamily:"Montserrat, sans-serif", cursor:"pointer", outline:"none" }}>
                            {["pending","processing","shipped","delivered","cancelled","exchange","return","return_requested","return_rejected","refunded"].map(s => <option key={s} value={s}>{s}</option>)}
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

        {/* USERS */}
        {activeTab === "users" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", gap:"12px" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"300", color:textColor, fontFamily:"Cormorant Garamond, serif", margin:0 }}>{t.manageUsers}</h2>
              <button onClick={() => { setUserForm({ name:"", email:"", password:"", role:"user" }); setUserFormErrors({}); setShowUserModal(true); }}
                style={{ padding: isMobile?"8px 14px":"10px 24px", background:"rgba(76,175,80,0.1)", color:"#4CAF50", border:"1px solid rgba(76,175,80,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                {isMobile ? "+" : "+ Add User"}
              </button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background:cardBg }}>{!isMobile&&<th style={thStyle}>{t.id}</th>}<th style={thStyle}>{t.name}</th>{!isMobile&&<th style={thStyle}>{t.email}</th>}<th style={thStyle}>{t.roleLabel}</th><th style={thStyle}>{t.actions}</th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ background: i%2===0?rowEven:rowOdd }}>
                      {!isMobile && <td style={tdStyle}>{u.id}</td>}
                      <td style={tdStyle}>{u.name||u.NAME}</td>
                      {!isMobile && <td style={tdStyle}>{u.email}</td>}
                      <td style={tdStyle}>
                        <span style={{ padding:"3px 8px", borderRadius:"2px", background:u.role==="admin"?"rgba(201,168,76,0.15)":isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)", color:u.role==="admin"?"#C9A84C":grayColor, fontSize:"9px", letterSpacing:"1px", textTransform:"uppercase", border:`1px solid ${u.role==="admin"?"rgba(201,168,76,0.3)":isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}` }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.id !== user?.id && (
                          <button onClick={() => deleteUser(u.id)} style={{ padding:isMobile?"4px 10px":"6px 16px", background:"transparent", color:"#E57373", border:"1px solid rgba(229,115,115,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                            {isMobile?"✕":t.delete}
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

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", gap:"12px" }}>
              <h2 style={{ fontSize:"16px", fontWeight:"300", color:textColor, fontFamily:"Cormorant Garamond, serif", margin:0 }}>{t.manageProducts}</h2>
              <button onClick={openAddProduct} style={{ padding:isMobile?"8px 14px":"10px 24px", background:"rgba(201,168,76,0.1)", color:"#C9A84C", border:"1px solid rgba(201,168,76,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                {isMobile?"+":`+ ${t.addProduct}`}
              </button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background:cardBg }}>
                    <th style={thStyle}>📷</th>
                    {!isMobile&&<th style={thStyle}>{t.id}</th>}
                    <th style={thStyle}>{t.nameLabel}</th>
                    <th style={thStyle}>{t.priceLabel}</th>
                    {!isMobile&&<th style={thStyle}>{t.stockLabel}</th>}
                    {!isTablet&&<th style={thStyle}>{t.categoryLabel}</th>}
                    <th style={thStyle}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id} style={{ background: i%2===0?rowEven:rowOdd }}>
                      <td style={{ ...tdStyle, width:"52px" }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width:"40px", height:"40px", objectFit:"cover", borderRadius:"4px", border:`1px solid ${borderColor}` }} />
                        ) : (
                          <div style={{ width:"40px", height:"40px", background:"#1C1008", borderRadius:"4px", border:`1px solid ${borderColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", color:"rgba(255,255,255,0.2)", fontFamily:"Cormorant Garamond, serif" }}>
                            {(p.name||p.NAME||"?").charAt(0)}
                          </div>
                        )}
                      </td>
                      {!isMobile&&<td style={tdStyle}>{p.id}</td>}
                      <td style={{ ...tdStyle, maxWidth:isMobile?"80px":"160px" }}>{p.name||p.NAME}</td>
                      <td style={{ ...tdStyle, color:"#C9A84C", whiteSpace:"nowrap" }}>€{p.price}</td>
                      {!isMobile&&<td style={tdStyle}>{p.stock}</td>}
                      {!isTablet&&<td style={tdStyle}>{p.category||"—"}</td>}
                      <td style={tdStyle}>
                        <div style={{ display:"flex", gap:"6px" }}>
                          <button onClick={() => openEditProduct(p)} style={{ padding:isMobile?"4px 8px":"6px 14px", background:"transparent", color:"#C9A84C", border:"1px solid rgba(201,168,76,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                            {isMobile?"✏️":t.edit}
                          </button>
                          <button onClick={() => deleteProduct(p.id)} style={{ padding:isMobile?"4px 8px":"6px 14px", background:"transparent", color:"#E57373", border:"1px solid rgba(229,115,115,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                            {isMobile?"✕":t.delete}
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

        {/* RETURNS */}
        {activeTab === "returns" && (
          <div>
            <h2 style={{ fontSize:"16px", fontWeight:"300", color:textColor, marginBottom:"16px", fontFamily:"Cormorant Garamond, serif" }}>
              ↩ Return Requests — <span style={{ color:"#FF5722" }}>{returns.length} aktive</span>
            </h2>
            {returns.length === 0 ? (
              <div style={{ padding:"80px 20px", textAlign:"center", color:grayColor }}>
                <div style={{ fontSize:"48px", marginBottom:"16px", opacity:0.3 }}>✅</div>
                <div style={{ fontSize:"16px", fontFamily:"Cormorant Garamond, serif", fontWeight:"300" }}>Nuk ka kërkesa aktive për kthim</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                {returns.map(order => (
                  <div key={order.id} style={{ background:cardBg, border:"1px solid rgba(255,87,34,0.2)", borderRadius:"6px", overflow:"hidden" }}>
                    <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(255,87,34,0.15)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", background: isDark ? "rgba(255,87,34,0.04)" : "rgba(255,87,34,0.02)" }}>
                      <div>
                        <div style={{ fontSize:"10px", letterSpacing:"3px", color:"#FF5722", textTransform:"uppercase", marginBottom:"4px" }}>Porosi #{order.id}</div>
                        <div style={{ fontSize:"15px", color:textColor, fontWeight:"500" }}>{order.User?.name || `User #${order.user_id}`}</div>
                        <div style={{ fontSize:"11px", color:grayColor, marginTop:"2px" }}>{order.User?.email}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"10px", color:grayColor, letterSpacing:"1px", textTransform:"uppercase" }}>Totali</div>
                        <div style={{ fontSize:"20px", fontFamily:"Cormorant Garamond, serif", color:"#C9A84C" }}>€{parseFloat(order.total_price).toFixed(2)}</div>
                        <div style={{ fontSize:"10px", color:grayColor, marginTop:"4px" }}>
                          {order.return_requested_at ? new Date(order.return_requested_at).toLocaleString("sq-AL") : "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(255,87,34,0.1)" }}>
                      <div style={{ fontSize:"10px", letterSpacing:"2px", color:grayColor, textTransform:"uppercase", marginBottom:"8px" }}>Arsyeja e kthimit</div>
                      <div style={{ fontSize:"13px", color:textColor, fontWeight:"300", lineHeight:"1.7", background: isDark ? "rgba(255,87,34,0.06)" : "rgba(255,87,34,0.04)", padding:"14px 16px", borderRadius:"4px", border:"1px solid rgba(255,87,34,0.1)", fontStyle:"italic" }}>
                        "{order.return_reason || "—"}"
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", display:"flex", flexDirection:isMobile?"column":"row", gap:"12px", alignItems:isMobile?"stretch":"flex-end" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"10px", letterSpacing:"2px", color:grayColor, textTransform:"uppercase", marginBottom:"6px" }}>Shënim për klientin (opsional)</div>
                        <input
                          placeholder="p.sh. Produkti do të zëvendësohet brenda 3 ditëve..."
                          onChange={e => setReturns(prev => prev.map(r => r.id === order.id ? { ...r, _adminNote: e.target.value } : r))}
                          style={{ width:"100%", padding:"10px 14px", background:inputBg, border:`1px solid ${borderColor}`, borderRadius:"2px", color:textColor, fontFamily:"Montserrat, sans-serif", fontSize:"12px", outline:"none", boxSizing:"border-box" }}
                        />
                      </div>
                      <div style={{ display:"flex", gap:"8px", flexShrink:0, flexWrap:"wrap" }}>
                        <button onClick={() => handleResolveReturn(order.id, "approve_refund", order._adminNote)}
                          style={{ padding:"10px 16px", background:"rgba(76,175,80,0.1)", color:"#4CAF50", border:"1px solid rgba(76,175,80,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", fontWeight:"700", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                          ✅ {isMobile ? "Refund" : "Aprovo Refund"}
                        </button>
                        <button onClick={() => handleResolveReturn(order.id, "approve_exchange", order._adminNote)}
                          style={{ padding:"10px 16px", background:"rgba(201,168,76,0.1)", color:"#C9A84C", border:"1px solid rgba(201,168,76,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", fontWeight:"700", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                          🔄 {isMobile ? "Exchange" : "Aprovo Exchange"}
                        </button>
                        <button onClick={() => handleResolveReturn(order.id, "reject", order._adminNote)}
                          style={{ padding:"10px 16px", background:"rgba(244,67,54,0.1)", color:"#F44336", border:"1px solid rgba(244,67,54,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", fontWeight:"700", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif", whiteSpace:"nowrap" }}>
                          ❌ {isMobile ? "Refuzo" : "Refuzo Kërkesën"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ADD USER MODAL */}
      {showUserModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}
          onClick={e => e.target===e.currentTarget && setShowUserModal(false)}>
          <div style={{ background:modalBg, border:"1px solid rgba(76,175,80,0.3)", borderRadius:"8px", padding:isMobile?"24px 20px":"36px", width:"100%", maxWidth:"460px", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", paddingBottom:"16px", borderBottom:`1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize:"10px", letterSpacing:"3px", color:"#4CAF50", textTransform:"uppercase", marginBottom:"6px" }}>Admin Panel</div>
                <h2 style={{ fontSize:"22px", fontWeight:"300", color:textColor, margin:0, fontFamily:"Cormorant Garamond, serif" }}>➕ Add New User</h2>
              </div>
              <button onClick={() => setShowUserModal(false)} style={{ background:"transparent", border:"none", color:grayColor, cursor:"pointer", fontSize:"20px" }}>✕</button>
            </div>
            {[
              { label:"Full Name *",  key:"name",     type:"text",     placeholder:"Full name",          error:userFormErrors.name },
              { label:"Email *",      key:"email",    type:"email",    placeholder:"email@example.com",  error:userFormErrors.email },
              { label:"Password *",   key:"password", type:"password", placeholder:"Min. 6 characters",  error:userFormErrors.password },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:"16px" }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={userForm[f.key]} onChange={e => setUserForm({ ...userForm, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ ...inputStyle, border:`1px solid ${f.error?"rgba(244,67,54,0.5)":borderColor}` }} />
                {f.error && <div style={{ fontSize:"10px", color:"#F44336", marginTop:"4px" }}>{f.error}</div>}
              </div>
            ))}
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Role *</label>
              <div style={{ display:"flex", gap:"10px" }}>
                {["user","admin"].map(r => (
                  <div key={r} onClick={() => setUserForm({ ...userForm, role:r })}
                    style={{ flex:1, padding:"12px 16px", border:`1px solid ${userForm.role===r?(r==="admin"?"#C9A84C":"#4CAF50"):borderColor}`, borderRadius:"4px", cursor:"pointer", background:userForm.role===r?(r==="admin"?"rgba(201,168,76,0.08)":"rgba(76,175,80,0.08)"):"transparent", transition:"all 0.2s", textAlign:"center" }}>
                    <div style={{ fontSize:"18px", marginBottom:"4px" }}>{r==="admin"?"🛡️":"👤"}</div>
                    <div style={{ fontSize:"10px", fontWeight:"600", letterSpacing:"2px", textTransform:"uppercase", color:userForm.role===r?(r==="admin"?"#C9A84C":"#4CAF50"):grayColor }}>{r}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:"12px" }}>
              <button onClick={() => setShowUserModal(false)} style={{ flex:1, padding:"13px", background:"transparent", color:grayColor, border:`1px solid ${borderColor}`, borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif" }}>Anulo</button>
              <button onClick={handleAddUser} disabled={savingUser} style={{ flex:2, padding:"13px", background:savingUser?"rgba(76,175,80,0.4)":"#4CAF50", color:"#fff", border:"none", borderRadius:"2px", cursor:savingUser?"not-allowed":"pointer", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif" }}>
                {savingUser?"Duke krijuar...":"✅ Krijo Userin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}
          onClick={e => e.target===e.currentTarget && closeModal()}>
          <div style={{ background:modalBg, border:`1px solid ${borderColor}`, borderRadius:"8px", padding:isMobile?"24px 20px":"36px", width:"100%", maxWidth:"520px", maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", paddingBottom:"16px", borderBottom:`1px solid ${borderColor}` }}>
              <h2 style={{ fontSize:isMobile?"18px":"22px", fontWeight:"300", color:textColor, margin:0, fontFamily:"Cormorant Garamond, serif" }}>
                {modalType==="editProduct" ? t.editProduct : t.addNewProduct}
              </h2>
              <button onClick={closeModal} style={{ background:"transparent", border:"none", color:grayColor, cursor:"pointer", fontSize:"20px" }}>✕</button>
            </div>
            <div style={{ marginBottom:"20px" }}>
              <label style={labelStyle}>📷 Product Image (optional)</label>
              <div onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ width:"100%", height: imagePreview ? "180px" : "130px", border:`2px dashed ${dragOver?"#C9A84C":imagePreview?"rgba(201,168,76,0.5)":borderColor}`, borderRadius:"8px", cursor:"pointer", overflow:"hidden", position:"relative", background:dragOver?"rgba(201,168,76,0.05)":inputBg, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box" }}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity="1"}
                      onMouseLeave={e => e.currentTarget.style.opacity="0"}>
                      <span style={{ color:"#fff", fontSize:"12px", letterSpacing:"2px", textTransform:"uppercase", fontWeight:"600" }}>Ndrysho Imazhin</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"20px" }}>
                    <div style={{ fontSize:"36px", marginBottom:"8px", opacity:0.4 }}>📷</div>
                    <div style={{ fontSize:"11px", color:grayColor, fontWeight:"300", marginBottom:"4px" }}>Kliko ose tërhiq imazhin këtu</div>
                    <div style={{ fontSize:"10px", color:grayColor, opacity:0.6 }}>JPEG · PNG · WebP · max 5MB</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={e => handleImageFile(e.target.files[0])} style={{ display:"none" }} />
              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ marginTop:"6px", fontSize:"10px", color:"#E57373", background:"none", border:"none", cursor:"pointer", padding:0, letterSpacing:"1px" }}>
                  ✕ Hiq imazhin
                </button>
              )}
            </div>
            {[
              { label:t.nameLabel,        key:"name",        type:"text",   required:true },
              { label:t.priceLabel,       key:"price",       type:"number", required:true },
              { label:t.categoryLabel,    key:"category",    type:"text" },
              { label:t.stockLabel,       key:"stock",       type:"number" },
              { label:t.descriptionLabel, key:"description", type:"text" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom:"14px" }}>
                <label style={{ display:"block", fontSize:"10px", letterSpacing:"2px", color:grayColor, textTransform:"uppercase", marginBottom:"6px" }}>
                  {field.label} {field.required && <span style={{ color:"#C9A84C" }}>*</span>}
                </label>
                <input type={field.type} value={formData[field.key]||""} onChange={e => setFormData({ ...formData, [field.key]:e.target.value })}
                  style={{ width:"100%", padding:"10px 14px", background:inputBg, border:`1px solid ${!formData[field.key]&&field.required?"rgba(229,115,115,0.5)":borderColor}`, borderRadius:"2px", color:textColor, fontFamily:"Montserrat, sans-serif", fontSize:"13px", outline:"none", boxSizing:"border-box" }} />
                {!formData[field.key] && field.required && (
                  <div style={{ color:"#E57373", fontSize:"11px", marginTop:"4px" }}>{field.label} {t.required}!</div>
                )}
              </div>
            ))}
            <div style={{ display:"flex", gap:"12px", marginTop:"20px" }}>
              <button onClick={handleSaveProduct} style={{ flex:1, padding:"14px", background:"rgba(201,168,76,0.15)", color:"#C9A84C", border:"1px solid rgba(201,168,76,0.3)", borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif" }}>{t.save}</button>
              <button onClick={closeModal} style={{ flex:1, padding:"14px", background:"transparent", color:grayColor, border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`, borderRadius:"2px", cursor:"pointer", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", fontFamily:"Montserrat, sans-serif" }}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
