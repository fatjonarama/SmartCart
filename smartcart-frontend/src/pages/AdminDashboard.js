import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, productsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/v1/stats/overview", { headers }),
        axios.get("http://localhost:5000/api/v1/users", { headers }),
        axios.get("http://localhost:5000/api/v1/products", { headers }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      toast.success("✅ Të dhënat u ngarkuan!");
    } catch (err) {
      toast.error("❌ Gabim gjatë ngarkimit!");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("A jeni i sigurt?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/users/${id}`, { headers });
      setUsers(users.filter((u) => u.id !== id));
      toast.success("✅ Përdoruesi u fshi!");
    } catch (err) {
      toast.error("❌ Gabim gjatë fshirjes!");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("A jeni i sigurt?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/v1/products/${id}`, { headers });
      setProducts(products.filter((p) => p.id !== id));
      toast.success("✅ Produkti u fshi!");
    } catch (err) {
      toast.error("❌ Gabim gjatë fshirjes!");
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "100px", fontSize: "20px" }}>
      Duke ngarkuar...
    </div>
  );

  return (
    <div style={{ padding: "100px 20px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <h1 style={{ color: "#333", marginBottom: "10px" }}>🛡️ Admin Dashboard</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Mirë se vini, <strong>{user?.name}</strong>! Role: <strong>{user?.role}</strong>
      </p>

      {/* STATS CARDS */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
          <div style={cardStyle("#4CAF50")}>
            <h3>👥 Përdorues</h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>{stats.totalUsers}</p>
          </div>
          <div style={cardStyle("#2196F3")}>
            <h3>📦 Produkte</h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>{stats.totalProducts}</p>
          </div>
          <div style={cardStyle("#FF9800")}>
            <h3>🛒 Orders</h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>{stats.totalOrders}</p>
          </div>
          <div style={cardStyle("#9C27B0")}>
            <h3>💰 Revenue</h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>€{Number(stats.totalRevenue).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["overview", "users", "products"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              background: activeTab === tab ? "#333" : "#fff",
              color: activeTab === tab ? "#fff" : "#333",
              border: "1px solid #333",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {tab === "overview" ? "📊 Overview" : tab === "users" ? "👥 Users" : "📦 Products"}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && stats && (
        <div>
          <h2>📊 Orders sipas statusit</h2>
          {stats.ordersByStatus.length === 0 ? (
            <p style={{ color: "#999" }}>Nuk ka orders ende.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#333", color: "#fff" }}>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Numri</th>
                </tr>
              </thead>
              <tbody>
                {stats.ordersByStatus.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                    <td style={tdStyle}>{s.status}</td>
                    <td style={tdStyle}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: "30px" }}>🏆 Top 5 Produktet</h2>
          {stats.topProducts.length === 0 ? (
            <p style={{ color: "#999" }}>Nuk ka të dhëna ende.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#333", color: "#fff" }}>
                  <th style={thStyle}>Produkti</th>
                  <th style={thStyle}>Total Shitur</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{p.total_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div>
          <h2>👥 Menaxhimi i Përdoruesve</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#333", color: "#fff" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Emri</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Roli</th>
                <th style={thStyle}>Veprime</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                  <td style={tdStyle}>{u.id}</td>
                  <td style={tdStyle}>{u.name || u.NAME}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "20px",
                      background: u.role === "admin" ? "#4CAF50" : "#2196F3",
                      color: "#fff",
                      fontSize: "12px"
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{
                          padding: "5px 15px",
                          background: "#f44336",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Fshi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div>
          <h2>📦 Menaxhimi i Produkteve</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#333", color: "#fff" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Emri</th>
                <th style={thStyle}>Çmimi</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Kategoria</th>
                <th style={thStyle}>Veprime</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                  <td style={tdStyle}>{p.id}</td>
                  <td style={tdStyle}>{p.name || p.NAME}</td>
                  <td style={tdStyle}>€{p.price}</td>
                  <td style={tdStyle}>{p.stock}</td>
                  <td style={tdStyle}>{p.category || "—"}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      style={{
                        padding: "5px 15px",
                        background: "#f44336",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Fshi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const cardStyle = (color) => ({
  background: color,
  color: "#fff",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
});

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const thStyle = {
  padding: "12px 15px",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px 15px",
  borderBottom: "1px solid #ddd",
};

export default AdminDashboard;