import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext"; // ✅ SHTU

const cardColors = [
  "#1C1008", "#081C10", "#08101C", "#1C0808",
  "#0F0C18", "#181208", "#0C1818", "#180C18",
  "#101810", "#181010",
];

const getProductCategory = (name) => {
  const n = name.toLowerCase();
  if (n.includes("headphone") || n.includes("audio") || n.includes("speaker")) return "Audio";
  if (n.includes("watch")) return "Tech";
  if (n.includes("shoe") || n.includes("sneaker") || n.includes("running")) return "Fashion";
  if (n.includes("wallet")) return "Accessories";
  if (n.includes("sunglass")) return "Eyewear";
  if (n.includes("perfume") || n.includes("fragrance")) return "Lifestyle";
  if (n.includes("backpack") || n.includes("bag")) return "Accessories";
  if (n.includes("coffee")) return "Home";
  if (n.includes("laptop") || n.includes("phone") || n.includes("iphone") || n.includes("samsung")) return "Electronics";
  if (n.includes("keyboard") || n.includes("mouse")) return "Accessories";
  return "Premium";
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState("");
  const [addedIds, setAddedIds] = useState([]);

  const { addToCart }                    = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist(); // ✅
  const navigate                         = useNavigate();
  const { isDark }                       = useTheme();
  const { t }                            = useLanguage();

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const heroBg      = isDark ? "#111111" : "#EBEBEB";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#666660";
  const borderColor = isDark ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.2)";
  const searchBg    = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const searchBorder = isDark ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.3)";

  useEffect(() => {
    axios.get("https://smartcart-ks.up.railway.app/api/v1/products")
      .then(res => {
        const data = res.data.data || res.data;
        setProducts(data);
        setFiltered(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    ));
  }, [search, products]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: parseFloat(product.price), image_url: product.image_url });
    setAddedIds(prev => [...prev, product.id]);
    setToast(`${product.name} ${t.added}`);
    setTimeout(() => setToast(""), 2500);
    setTimeout(() => setAddedIds(prev => prev.filter(id => id !== product.id)), 2000);
  };

  // ✅ Shto/hiq nga wishlist
  const handleWishlist = (e, product) => {
    e.stopPropagation();
    const wasIn = isInWishlist(product.id);
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      category: product.category || getProductCategory(product.name),
      description: product.description,
      image_url: product.image_url || null,
    });
    setToast(wasIn ? `${product.name} u hoq nga wishlist` : `${product.name} u shtua në wishlist ♡`);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Montserrat, sans-serif", color: textColor, paddingTop: "80px", transition: "all 0.3s" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .product-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important; }
        .product-card:hover { transform: translateY(-6px) !important; box-shadow: 0 32px 64px rgba(0,0,0,0.15) !important; }
        .product-overlay { opacity: 0; transition: opacity 0.35s ease; }
        .product-card:hover .product-overlay { opacity: 1; }
        .wishlist-btn { transition: all 0.2s; }
        .wishlist-btn:hover { transform: scale(1.15); }
      `}</style>

      {/* HERO */}
      <div style={{ padding: "80px 60px 60px", background: heroBg, borderBottom: `1px solid ${borderColor}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
        <div style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
          <span style={{ width: "30px", height: "1px", background: "#C9A84C", opacity: 0.5, display: "inline-block" }} />
          {t.collection}
        </div>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(40px, 6vw, 72px)", fontWeight: "300", color: textColor, lineHeight: "1", position: "relative", zIndex: 1, margin: 0 }}>
          {t.ourPremium} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>{t.premium}</em><br />{t.productsTitle}
        </h1>
      </div>

      {/* SEARCH */}
      <div style={{ padding: "28px 60px", background: heroBg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", borderBottom: `1px solid ${borderColor}`, position: "sticky", top: "80px", zIndex: 10, backdropFilter: "blur(10px)" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
          <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#C9A84C", fontSize: "14px", opacity: 0.5 }}>⌕</span>
          <input
            style={{ width: "100%", padding: "11px 16px 11px 40px", background: searchBg, border: `1px solid ${searchBorder}`, borderRadius: "2px", color: textColor, fontFamily: "Montserrat, sans-serif", fontSize: "12px", fontWeight: "300", outline: "none", boxSizing: "border-box" }}
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: "11px", letterSpacing: "2px", color: grayColor, fontWeight: "300" }}>
          {t.showing} <span style={{ color: "#C9A84C", fontWeight: "500" }}>{filtered.length}</span> {filtered.length === 1 ? t.product : t.products_plural}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <div style={{ width: "44px", height: "44px", border: "1px solid rgba(201,168,76,0.15)", borderTop: "1px solid #C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: "10px", letterSpacing: "5px", color: grayColor, textTransform: "uppercase" }}>{t.loading}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: "300", color: grayColor }}>{t.noProducts}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "28px", padding: "52px 60px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
          {filtered.map((product, i) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => navigate(`/products/${product.id}`)}
              style={{ background: cardBg, borderRadius: "6px", border: `1px solid ${borderColor}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", boxShadow: isDark ? "none" : "0 2px 20px rgba(0,0,0,0.08)", position: "relative" }}
            >
              {/* ✅ WISHLIST BUTTON */}
              <button
                className="wishlist-btn"
                onClick={e => handleWishlist(e, product)}
                title={isInWishlist(product.id) ? "Hiq nga wishlist" : "Shto në wishlist"}
                style={{
                  position: "absolute", top: "12px", right: "12px", zIndex: 3,
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: isInWishlist(product.id) ? "rgba(201,168,76,0.95)" : "rgba(0,0,0,0.45)",
                  border: "none", cursor: "pointer", fontSize: "17px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(4px)", color: isInWishlist(product.id) ? "#0A0A0A" : "#fff",
                }}
              >
                {isInWishlist(product.id) ? "♥" : "♡"}
              </button>

              {/* ✅ IMAGE — shfaq imazhin nëse ekziston */}
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", backgroundColor: cardColors[i % cardColors.length] }}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  />
                ) : (
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "80px", fontWeight: "300", color: "rgba(255,255,255,0.08)", lineHeight: "1", userSelect: "none" }}>
                    {(product.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                {/* OVERLAY */}
                <div
                  className="product-overlay"
                  style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <button
                    onClick={e => handleAddToCart(e, product)}
                    style={{ padding: "13px 32px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}
                  >
                    {t.addToCart}
                  </button>
                </div>
              </div>

              {/* INFO */}
              <div style={{ padding: "24px 24px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", opacity: 0.7 }}>
                  {product.category || getProductCategory(product.name)}
                </div>
                <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: "400", color: textColor, lineHeight: "1.2", margin: 0 }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: "12px", color: grayColor, fontWeight: "300", lineHeight: "1.7", flex: 1, margin: 0 }}>
                  {product.description || "Premium quality product"}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: `1px solid ${borderColor}`, marginTop: "8px" }}>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "30px", fontWeight: "300", color: "#C9A84C", lineHeight: "1" }}>
                    €{parseFloat(product.price).toFixed(2)}
                  </div>
                  <button
                    onClick={e => handleAddToCart(e, product)}
                    style={{ padding: "9px 18px", background: addedIds.includes(product.id) ? "#C9A84C" : "transparent", border: "1px solid rgba(201,168,76,0.35)", borderRadius: "2px", color: addedIds.includes(product.id) ? "#0A0A0A" : "#C9A84C", fontFamily: "Montserrat, sans-serif", fontSize: "9px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}
                  >
                    {addedIds.includes(product.id) ? `✓ ${t.added}` : `+ ${t.cart}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", background: isDark ? "#1A1A1A" : "#FFFFFF", border: `1px solid rgba(201,168,76,0.25)`, borderLeft: "3px solid #C9A84C", padding: "14px 22px", fontSize: "12px", color: textColor, fontWeight: "300", zIndex: 9999, borderRadius: "3px", boxShadow: "0 16px 40px rgba(0,0,0,0.2)" }}>
          ✦ {toast}
        </div>
      )}
    </div>
  );
}
