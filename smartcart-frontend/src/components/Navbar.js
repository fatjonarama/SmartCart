import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Montserrat:wght@300;400;500;600&display=swap');

  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    transition: all 0.4s ease;
    font-family: 'Montserrat', sans-serif;
  }

  .navbar.scrolled {
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.15);
  }

  .navbar.top { background: transparent; }

  .nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 60px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 300;
    color: #C9A84C;
    text-decoration: none;
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 40px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-link {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    text-decoration: none;
    transition: color 0.3s;
    position: relative;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px; left: 0;
    width: 0; height: 1px;
    background: #C9A84C;
    transition: width 0.3s ease;
  }

  .nav-link:hover, .nav-link.active { color: #C9A84C !important; }
  .nav-link:hover::after, .nav-link.active::after { width: 100%; }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-cart {
    position: relative;
    cursor: pointer;
    font-size: 18px;
    transition: color 0.3s;
    text-decoration: none;
    display: flex;
    align-items: center;
  }

  .nav-cart:hover { color: #C9A84C; }

  .cart-badge {
    position: absolute;
    top: -8px; right: -8px;
    background: #C9A84C;
    color: #0A0A0A;
    font-size: 9px;
    font-weight: 700;
    width: 18px; height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn {
    padding: 8px 20px;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    border-radius: 2px;
  }

  .nav-btn-outline {
    background: transparent;
    border: 1px solid rgba(201,168,76,0.4);
  }

  .nav-btn-outline:hover { border-color: #C9A84C; color: #C9A84C; }

  .nav-btn-gold { background: #C9A84C; color: #0A0A0A; }
  .nav-btn-gold:hover { background: #E8D5A3; transform: translateY(-1px); }

  .nav-btn-admin { background: #9C27B0; color: #fff; }
  .nav-btn-admin:hover { background: #7B1FA2; transform: translateY(-1px); }

  .nav-btn-orders {
    background: transparent;
    border: 1px solid rgba(201,168,76,0.4);
    color: #C9A84C;
  }
  .nav-btn-orders:hover { background: rgba(201,168,76,0.1); border-color: #C9A84C; }

  .nav-user {
    font-size: 10px;
    letter-spacing: 2px;
    color: #C9A84C;
    font-weight: 500;
    text-transform: uppercase;
  }

  .theme-toggle {
    width: 44px; height: 24px;
    border-radius: 12px;
    border: 1px solid rgba(201,168,76,0.3);
    cursor: pointer;
    position: relative;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    padding: 2px;
    background: transparent;
  }

  .theme-toggle-knob {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #C9A84C;
    transition: transform 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  }

  .lang-toggle {
    display: flex;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  .lang-btn {
    padding: 5px 10px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    cursor: pointer;
    border: none;
    font-family: 'Montserrat', sans-serif;
    transition: all 0.2s;
  }

  .lang-btn.active { background: #C9A84C; color: #0A0A0A; }

  .mobile-menu {
    position: fixed;
    top: 80px; left: 0; right: 0;
    z-index: 999;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.15);
  }

  .mobile-nav-link {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 0;
    border-bottom: 1px solid rgba(201,168,76,0.08);
    display: block;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    padding: 4px;
    background: transparent;
    border: none;
  }

  .hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: #C9A84C;
    transition: all 0.3s;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    .nav-inner { padding: 0 20px; }
    .nav-links { display: none; }
  }
`;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navBg = isDark
    ? scrolled || menuOpen ? "rgba(10,10,10,0.97)" : "transparent"
    : scrolled || menuOpen ? "rgba(245,245,240,0.97)" : "transparent";

  const linkColor = isDark ? "rgba(245,240,232,0.7)" : "rgba(30,30,30,0.7)";
  const textColor = isDark ? "#F5F0E8" : "#1A1A1A";

  // ✅ isUser — true nëse është i loguar por NUK është admin
  const isUser = isAuthenticated && user?.role !== "admin";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate("/login"); };

  // ✅ My Orders vetëm për user, jo admin
  const navLinks = [
    { to: "/", label: t.home },
    { to: "/products", label: t.products },
    ...(isUser ? [{ to: "/my-orders", label: t.myOrders }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: t.admin }] : []),
  ];

  return (
    <>
      <style>{styles}</style>
      <nav className={`navbar ${scrolled ? "scrolled" : "top"}`} style={{ background: navBg }}>
        <div className="nav-inner">

          <Link to="/" className="nav-brand">SmartCart</Link>

          {!isMobile && (
            <ul className="nav-links">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={`nav-link ${location.pathname === to ? "active" : ""}`} style={{ color: linkColor }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="nav-right">

            <div className="lang-toggle">
              <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => lang !== "en" && toggleLang()} style={{ background: lang === "en" ? "#C9A84C" : "transparent", color: lang === "en" ? "#0A0A0A" : isDark ? "rgba(245,240,232,0.5)" : "rgba(30,30,30,0.5)" }}>EN</button>
              <button className={`lang-btn ${lang === "al" ? "active" : ""}`} onClick={() => lang !== "al" && toggleLang()} style={{ background: lang === "al" ? "#C9A84C" : "transparent", color: lang === "al" ? "#0A0A0A" : isDark ? "rgba(245,240,232,0.5)" : "rgba(30,30,30,0.5)" }}>AL</button>
            </div>

            <button className="theme-toggle" onClick={toggleTheme}>
              <div className="theme-toggle-knob" style={{ transform: isDark ? "translateX(0)" : "translateX(20px)" }}>
                {isDark ? "🌙" : "☀️"}
              </div>
            </button>

            <Link to="/cart" className="nav-cart" style={{ color: isDark ? "rgba(245,240,232,0.7)" : "rgba(30,30,30,0.7)" }}>
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {!isMobile && (
              <>
                {isAuthenticated ? (
                  <>
                    <span className="nav-user">{user?.name?.split(" ")[0]}</span>
                    {user?.role === "admin" && (
                      <button className="nav-btn nav-btn-admin" onClick={() => navigate("/admin")}>
                        🛡️ {t.admin}
                      </button>
                    )}
                    {/* ✅ Vetëm për user, jo admin */}
                    {isUser && (
                      <button className="nav-btn nav-btn-orders" onClick={() => navigate("/my-orders")}>
                        📦 {t.myOrders}
                      </button>
                    )}
                    <button className="nav-btn nav-btn-outline" onClick={handleLogout} style={{ color: isDark ? "rgba(245,240,232,0.8)" : "rgba(30,30,30,0.8)" }}>
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="nav-btn nav-btn-outline" onClick={() => navigate("/login")} style={{ color: isDark ? "rgba(245,240,232,0.8)" : "rgba(30,30,30,0.8)" }}>
                      {t.login}
                    </button>
                    <button className="nav-btn nav-btn-gold" onClick={() => navigate("/register")}>
                      {t.register}
                    </button>
                  </>
                )}
              </>
            )}

            {isMobile && (
              <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
                <span style={{ opacity: menuOpen ? 0 : 1 }} />
                <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className="mobile-menu" style={{ background: isDark ? "rgba(10,10,10,0.97)" : "rgba(245,245,240,0.97)" }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="mobile-nav-link" style={{ color: location.pathname === to ? "#C9A84C" : linkColor }}>
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
              <span style={{ fontSize: "11px", color: "#C9A84C", letterSpacing: "2px", textTransform: "uppercase" }}>
                {user?.name}
              </span>
              {user?.role === "admin" && (
                <button className="nav-btn nav-btn-admin" onClick={() => navigate("/admin")} style={{ width: "100%" }}>
                  🛡️ {t.admin}
                </button>
              )}
              {/* ✅ Vetëm për user, jo admin */}
              {isUser && (
                <button className="nav-btn nav-btn-orders" onClick={() => navigate("/my-orders")} style={{ width: "100%" }}>
                  📦 {t.myOrders}
                </button>
              )}
              <button className="nav-btn nav-btn-outline" onClick={handleLogout} style={{ color: textColor, width: "100%" }}>
                {t.logout}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button className="nav-btn nav-btn-outline" onClick={() => navigate("/login")} style={{ color: textColor, flex: 1 }}>
                {t.login}
              </button>
              <button className="nav-btn nav-btn-gold" onClick={() => navigate("/register")} style={{ flex: 1 }}>
                {t.register}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}