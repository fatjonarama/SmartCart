import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth }     from "../context/AuthContext";
import { useCart }     from "../context/CartContext";
import { useTheme }    from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Montserrat:wght@300;400;500;600&display=swap');
  .navbar { position:fixed; top:0; left:0; right:0; z-index:1000; transition:all 0.4s ease; font-family:'Montserrat',sans-serif; }
  .navbar.scrolled { backdrop-filter:blur(20px); border-bottom:1px solid rgba(201,168,76,0.15); }
  .nav-inner { max-width:1400px; margin:0 auto; padding:0 60px; height:80px; display:flex; align-items:center; justify-content:space-between; }
  .nav-brand { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:300; color:#C9A84C; text-decoration:none; letter-spacing:4px; text-transform:uppercase; }
  .nav-links { display:flex; align-items:center; gap:40px; list-style:none; margin:0; padding:0; }
  .nav-link { font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; text-decoration:none; transition:color 0.3s; position:relative; }
  .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:1px; background:#C9A84C; transition:width 0.3s ease; }
  .nav-link:hover, .nav-link.active { color:#C9A84C !important; }
  .nav-link:hover::after, .nav-link.active::after { width:100%; }
  .nav-right { display:flex; align-items:center; gap:14px; }
  .nav-icon { position:relative; cursor:pointer; font-size:18px; transition:all 0.2s; text-decoration:none; display:flex; align-items:center; background:transparent; border:none; padding:4px; }
  .nav-icon:hover { transform:scale(1.1); }
  .badge { position:absolute; top:-8px; right:-8px; font-size:9px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .cart-badge { background:#C9A84C; color:#0A0A0A; }
  .wish-badge { background:#E57373; color:#fff; }
  .nav-btn { padding:8px 20px; font-family:'Montserrat',sans-serif; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; border:none; border-radius:2px; }
  .nav-btn-outline { background:transparent; border:1px solid rgba(201,168,76,0.4); }
  .nav-btn-outline:hover { border-color:#C9A84C; color:#C9A84C; }
  .nav-btn-gold { background:#C9A84C; color:#0A0A0A; }
  .nav-btn-gold:hover { background:#E8D5A3; transform:translateY(-1px); }
  .nav-btn-admin { background:#9C27B0; color:#fff; }
  .nav-btn-admin:hover { background:#7B1FA2; transform:translateY(-1px); }
  .nav-btn-orders { background:transparent; border:1px solid rgba(201,168,76,0.4); color:#C9A84C; }
  .nav-btn-orders:hover { background:rgba(201,168,76,0.1); border-color:#C9A84C; }
  .nav-user { font-size:10px; letter-spacing:2px; color:#C9A84C; font-weight:500; text-transform:uppercase; text-decoration:none; }
  .nav-user:hover { text-decoration:underline; }
  .theme-toggle { width:44px; height:24px; border-radius:12px; border:1px solid rgba(201,168,76,0.3); cursor:pointer; position:relative; transition:all 0.3s; display:flex; align-items:center; padding:2px; background:transparent; }
  .theme-knob { width:18px; height:18px; border-radius:50%; background:#C9A84C; transition:transform 0.3s; display:flex; align-items:center; justify-content:center; font-size:10px; }
  .lang-toggle { display:flex; border:1px solid rgba(201,168,76,0.3); border-radius:2px; overflow:hidden; }
  .lang-btn { padding:5px 10px; font-size:9px; font-weight:600; letter-spacing:1px; cursor:pointer; border:none; font-family:'Montserrat',sans-serif; transition:all 0.2s; }
  .mobile-menu { position:fixed; top:80px; left:0; right:0; z-index:999; padding:24px; display:flex; flex-direction:column; gap:16px; backdrop-filter:blur(20px); border-bottom:1px solid rgba(201,168,76,0.15); }
  .mobile-link { font-size:12px; font-weight:500; letter-spacing:3px; text-transform:uppercase; text-decoration:none; padding:12px 0; border-bottom:1px solid rgba(201,168,76,0.08); display:block; }
  .hamburger { display:flex; flex-direction:column; gap:5px; cursor:pointer; padding:4px; background:transparent; border:none; }
  .hamburger span { display:block; width:22px; height:2px; background:#C9A84C; transition:all 0.3s; border-radius:2px; }
  @media (max-width:768px) { .nav-inner { padding:0 20px; } .nav-links { display:none; } }
`;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount }    = useCart();
  const { wishlist }     = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();

  const navBg     = isDark
    ? scrolled || menuOpen ? "rgba(10,10,10,0.97)"    : "transparent"
    : scrolled || menuOpen ? "rgba(245,245,240,0.97)" : "transparent";
  const linkColor = isDark ? "rgba(245,240,232,0.7)" : "rgba(30,30,30,0.7)";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";
  const isUser    = isAuthenticated && user?.role !== "admin";

  useEffect(() => {
    const onScroll  = () => setScrolled(window.scrollY > 40);
    const onResize  = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const navLinks = [
    { to: "/",         label: t.home },
    { to: "/products", label: t.products },
    ...(isUser            ? [{ to: "/my-orders", label: t.myOrders }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: t.admin }] : []),
  ];

  return (
    <>
      <style>{styles}</style>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} style={{ background: navBg }}>
        <div className="nav-inner">
          <Link to="/" className="nav-brand">SmartCart</Link>

          {!isMobile && (
            <ul className="nav-links">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={`nav-link ${location.pathname === to ? "active" : ""}`} style={{ color: linkColor }}>{label}</Link>
                </li>
              ))}
            </ul>
          )}

          <div className="nav-right">
            {/* Lang */}
            <div className="lang-toggle">
              <button className="lang-btn" onClick={() => lang !== "en" && toggleLang()} style={{ background: lang === "en" ? "#C9A84C" : "transparent", color: lang === "en" ? "#0A0A0A" : isDark ? "rgba(245,240,232,0.5)" : "rgba(30,30,30,0.5)" }}>EN</button>
              <button className="lang-btn" onClick={() => lang !== "al" && toggleLang()} style={{ background: lang === "al" ? "#C9A84C" : "transparent", color: lang === "al" ? "#0A0A0A" : isDark ? "rgba(245,240,232,0.5)" : "rgba(30,30,30,0.5)" }}>AL</button>
            </div>

            {/* Theme */}
            <button className="theme-toggle" onClick={toggleTheme}>
              <div className="theme-knob" style={{ transform: isDark ? "translateX(0)" : "translateX(20px)" }}>
                {isDark ? "🌙" : "☀️"}
              </div>
            </button>

            {/* Wishlist — vetëm kur i loguar */}
            {isAuthenticated && (
              <Link to="/wishlist" className="nav-icon" title={t.wishlist}
                style={{ color: wishlist.length > 0 ? "#E57373" : (isDark ? "rgba(245,240,232,0.7)" : "rgba(30,30,30,0.7)") }}>
                {wishlist.length > 0 ? "♥" : "♡"}
                {wishlist.length > 0 && <span className="badge wish-badge">{wishlist.length}</span>}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="nav-icon" style={{ color: isDark ? "rgba(245,240,232,0.7)" : "rgba(30,30,30,0.7)" }}>
              🛒
              {cartCount > 0 && <span className="badge cart-badge">{cartCount}</span>}
            </Link>

            {!isMobile && (
              <>
                {isAuthenticated ? (
                  <>
                    {/* Emri → Profile */}
                    <Link to="/profile" className="nav-user">{user?.name?.split(" ")[0]}</Link>

                    {user?.role === "admin" && (
                      <button className="nav-btn nav-btn-admin" onClick={() => navigate("/admin")}>🛡️ {t.admin}</button>
                    )}
                    {isUser && (
                      <button className="nav-btn nav-btn-orders" onClick={() => navigate("/my-orders")}>📦 {t.myOrders}</button>
                    )}
                    <button className="nav-btn nav-btn-outline" onClick={handleLogout} style={{ color: isDark ? "rgba(245,240,232,0.8)" : "rgba(30,30,30,0.8)" }}>
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="nav-btn nav-btn-outline" onClick={() => navigate("/login")} style={{ color: isDark ? "rgba(245,240,232,0.8)" : "rgba(30,30,30,0.8)" }}>{t.login}</button>
                    <button className="nav-btn nav-btn-gold"    onClick={() => navigate("/register")}>{t.register}</button>
                  </>
                )}
              </>
            )}

            {isMobile && (
              <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
                <span style={{ opacity: menuOpen ? 0 : 1 }} />
                <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div className="mobile-menu" style={{ background: isDark ? "rgba(10,10,10,0.97)" : "rgba(245,245,240,0.97)" }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="mobile-link" style={{ color: location.pathname === to ? "#C9A84C" : linkColor }}>{label}</Link>
          ))}
          {isAuthenticated && (
            <Link to="/wishlist" className="mobile-link" style={{ color: wishlist.length > 0 ? "#E57373" : linkColor }}>
              {wishlist.length > 0 ? "♥" : "♡"} {t.wishlist} {wishlist.length > 0 && `(${wishlist.length})`}
            </Link>
          )}
          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
              <Link to="/profile" style={{ fontSize: "11px", color: "#C9A84C", letterSpacing: "2px", textTransform: "uppercase", textDecoration: "none" }}>
                👤 {user?.name}
              </Link>
              {user?.role === "admin" && <button className="nav-btn nav-btn-admin" onClick={() => navigate("/admin")} style={{ width: "100%" }}>🛡️ {t.admin}</button>}
              {isUser && <button className="nav-btn nav-btn-orders" onClick={() => navigate("/my-orders")} style={{ width: "100%" }}>📦 {t.myOrders}</button>}
              <button className="nav-btn nav-btn-outline" onClick={handleLogout} style={{ color: textColor, width: "100%" }}>{t.logout}</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button className="nav-btn nav-btn-outline" onClick={() => navigate("/login")} style={{ color: textColor, flex: 1 }}>{t.login}</button>
              <button className="nav-btn nav-btn-gold" onClick={() => navigate("/register")} style={{ flex: 1 }}>{t.register}</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
