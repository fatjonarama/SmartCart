import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const cardColors = [
  "#1C1008", "#081C10", "#08101C", "#1C0808",
  "#0F0C18", "#181208", "#0C1818", "#180C18",
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#666660";
  const borderColor = isDark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.3)";

  useEffect(() => {
    axios.get(`https://smartcart-ks.up.railway.app/api/v1/products/${id}`)
      .then(res => {
        setProduct(res.data.data || res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        navigate("/products");
      });
  }, [id, navigate]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({ id: product.id, name: product.name, price: parseFloat(product.price) });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "44px", height: "44px", border: "1px solid rgba(201,168,76,0.15)", borderTop: "1px solid #C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!product) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Montserrat, sans-serif", paddingTop: "80px" }}>

      {/* BACK BUTTON */}
      <div style={{ padding: "24px 60px", borderBottom: `1px solid ${borderColor}` }}>
        <button onClick={() => navigate("/products")} style={{
          background: "transparent", border: "none",
          color: "#C9A84C", cursor: "pointer",
          fontSize: "11px", letterSpacing: "2px",
          textTransform: "uppercase", fontFamily: "Montserrat, sans-serif",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          ← {t.backToProducts}
        </button>
      </div>

      {/* PRODUCT DETAIL */}
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        padding: "60px", display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: "60px",
        alignItems: "start"
      }}>

        {/* LEFT — IMAGE */}
        <div>
          <div style={{
            height: "480px", borderRadius: "8px",
            background: cardColors[product.id % cardColors.length],
            border: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px", overflow: "hidden"
          }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "160px", fontWeight: "300",
                color: "rgba(255,255,255,0.08)", userSelect: "none"
              }}>
                {product.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* THUMBNAIL ROW */}
          <div style={{ display: "flex", gap: "12px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: "80px", height: "80px", borderRadius: "4px",
                background: cardColors[(product.id + i) % cardColors.length],
                border: i === 1 ? "2px solid #C9A84C" : `1px solid ${borderColor}`,
                cursor: "pointer", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "28px", fontWeight: "300",
                    color: "rgba(255,255,255,0.1)"
                  }}>
                    {product.name?.charAt(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — INFO */}
        <div>
          <div style={{
            fontSize: "10px", letterSpacing: "4px",
            color: "#C9A84C", textTransform: "uppercase", marginBottom: "16px"
          }}>
            {product.category || "Premium"}
          </div>

          <h1 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "48px", fontWeight: "300",
            color: textColor, margin: "0 0 16px", lineHeight: "1.1"
          }}>
            {product.name}
          </h1>

          <div style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "42px", fontWeight: "300",
            color: "#C9A84C", marginBottom: "32px"
          }}>
            €{parseFloat(product.price).toFixed(2)}
          </div>

          <div style={{ height: "1px", background: borderColor, marginBottom: "32px" }} />

          <div style={{ marginBottom: "32px" }}>
            <div style={{
              fontSize: "10px", letterSpacing: "3px",
              color: "#C9A84C", textTransform: "uppercase", marginBottom: "12px"
            }}>
              {t.description}
            </div>
            <p style={{ fontSize: "14px", color: grayColor, lineHeight: "1.8", fontWeight: "300" }}>
              {product.description || "Premium quality product crafted with exceptional materials and attention to detail."}
            </p>
          </div>

          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: product.stock > 0 ? "#4CAF50" : "#E57373"
            }} />
            <span style={{ fontSize: "12px", color: grayColor, letterSpacing: "1px" }}>
              {product.stock > 0 ? `${t.inStock} (${product.stock})` : t.outOfStock}
            </span>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div style={{
              fontSize: "10px", letterSpacing: "3px",
              color: "#C9A84C", textTransform: "uppercase", marginBottom: "12px"
            }}>
              {t.quantity}
            </div>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1px solid ${borderColor}`, width: "fit-content"
            }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ width: "44px", height: "44px", background: "transparent", border: "none", color: "#C9A84C", fontSize: "18px", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
                −
              </button>
              <span style={{ width: "44px", textAlign: "center", fontSize: "14px", color: textColor }}>
                {quantity}
              </span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                style={{ width: "44px", height: "44px", background: "transparent", border: "none", color: "#C9A84C", fontSize: "18px", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
                +
              </button>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={product.stock === 0}
            style={{
              width: "100%", padding: "18px",
              background: added ? "#4CAF50" : "#C9A84C",
              color: "#0A0A0A", border: "none",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "10px", fontWeight: "700",
              letterSpacing: "4px", textTransform: "uppercase",
              cursor: product.stock === 0 ? "not-allowed" : "pointer",
              opacity: product.stock === 0 ? 0.5 : 1,
              transition: "all 0.3s", marginBottom: "16px"
            }}>
            {added ? `✓ ${t.added}` : t.addToCart}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "32px" }}>
            {["Free Shipping", "Secure Payment", "Easy Returns", "24/7 Support"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: grayColor }}>
                <div style={{ width: "5px", height: "5px", border: "1px solid #C9A84C", borderRadius: "50%" }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}