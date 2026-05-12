import React from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "react-toastify";

const cardColors = [
  "#1C1008", "#081C10", "#08101C", "#1C0808",
  "#0F0C18", "#181208", "#0C1818", "#180C18",
];

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart }  = useCart();
  const { isDark }     = useTheme();
  const { t }          = useLanguage();
  const navigate       = useNavigate();

  const bg          = isDark ? "#0A0A0A" : "#F5F5F0";
  const heroBg      = isDark ? "#111111" : "#EBEBEB";
  const cardBg      = isDark ? "#111111" : "#FFFFFF";
  const textColor   = isDark ? "#F5F0E8" : "#1A1A1A";
  const grayColor   = isDark ? "#888880" : "#555550";
  const borderColor = isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.25)";

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`✅ "${product.name}" ${t.wishlistAddedToCart}`);
  };

  const handleMoveAllToCart = () => {
    wishlist.forEach(p => addToCart(p));
    clearWishlist();
    toast.success(`✅ ${t.wishlistAddAll}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily: "Montserrat, sans-serif", paddingTop: "80px", transition: "all 0.3s" }}>
      <style>{`
        .wishlist-card:hover .remove-btn { opacity: 1 !important; }
        .wishlist-card:hover { border-color: rgba(201,168,76,0.3) !important; }
        .add-cart-btn:hover { background: #C9A84C !important; color: #0A0A0A !important; }
      `}</style>

      {/* HERO */}
      <div style={{ padding: "60px 60px 40px", background: heroBg, borderBottom: `1px solid ${borderColor}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#C9A84C", fontWeight: "500", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "30px", height: "1px", background: "#C9A84C", opacity: 0.5, display: "inline-block" }} />
            {t.wishlistEyebrow || "My Wishlist"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: "300", color: textColor, lineHeight: "1", margin: 0 }}>
                {t.wishlistTitle || "Wishlist"} <em style={{ fontStyle: "italic", color: "#C9A84C" }}>♡</em>
              </h1>
              <p style={{ fontSize: "12px", color: grayColor, marginTop: "12px", fontWeight: "300", letterSpacing: "1px" }}>
                {wishlist.length === 0
                  ? (t.wishlistEmpty || "Your wishlist is empty")
                  : `${wishlist.length} ${t.wishlistSaved || "saved"}`}
              </p>
            </div>
            {wishlist.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={handleMoveAllToCart}
                  style={{ padding: "12px 28px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
                  {t.wishlistAddAll || "🛒 Add All to Cart"}
                </button>
                <button onClick={() => { if (window.confirm(t.confirmDelete || "Are you sure?")) clearWishlist(); }}
                  style={{ padding: "12px 20px", background: "transparent", color: "#E57373", border: "1px solid rgba(229,115,115,0.3)", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
                  {t.wishlistClear || "Clear List"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 60px" }}>
        {wishlist.length === 0 ? (
          <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", opacity: 0.1, fontFamily: "Cormorant Garamond, serif", color: "#C9A84C" }}>♡</div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: "300", color: textColor }}>
              {t.wishlistEmpty || "Your wishlist is empty"}
            </h2>
            <p style={{ fontSize: "13px", color: grayColor, fontWeight: "300", maxWidth: "360px", lineHeight: "1.8" }}>
              {t.wishlistEmptySub || "Add products to your wishlist by clicking the ♡ icon."}
            </p>
            <button onClick={() => navigate("/products")}
              style={{ padding: "14px 40px", background: "#C9A84C", color: "#0A0A0A", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", marginTop: "8px" }}>
              {t.exploreProducts || "Explore Products →"}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {wishlist.map((product, i) => (
              <div key={product.id} className="wishlist-card"
                style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "8px", overflow: "hidden", transition: "border-color 0.2s", position: "relative" }}>
                <button className="remove-btn"
                  onClick={() => { removeFromWishlist(product.id); toast.info(t.wishlistRemoved || "Removed from wishlist."); }}
                  style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}>
                  ✕
                </button>
                <div style={{ width: "100%", height: "200px", background: cardColors[i % cardColors.length], display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "60px", fontWeight: "300", color: "rgba(255,255,255,0.1)" }}>
                      {(product.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(201,168,76,0.9)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>♥</div>
                </div>
                <div style={{ padding: "20px" }}>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", fontWeight: "400", color: textColor, marginBottom: "6px" }}>{product.name}</div>
                  {product.category && <div style={{ fontSize: "10px", letterSpacing: "2px", color: grayColor, textTransform: "uppercase", marginBottom: "12px" }}>{product.category}</div>}
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: "300", color: "#C9A84C", marginBottom: "16px" }}>
                    €{parseFloat(product.price).toFixed(2)}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="add-cart-btn" onClick={() => handleAddToCart(product)}
                      style={{ flex: 1, padding: "11px 0", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "2px", cursor: "pointer", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif", transition: "all 0.2s" }}>
                      {t.addToCartBtn || "+ Cart"}
                    </button>
                    <button onClick={() => navigate(`/products/${product.id}`)}
                      style={{ padding: "11px 16px", background: "transparent", color: grayColor, border: `1px solid ${borderColor}`, borderRadius: "2px", cursor: "pointer", fontSize: "10px", fontFamily: "Montserrat, sans-serif" }}>
                      →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
