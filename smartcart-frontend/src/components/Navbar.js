import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

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
    background: rgba(10,10,10,0.97);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.15);
  }

  .navbar.top {
    background: transparent;
  }

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
  }

  .nav-link {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(245,240,232,0.7);
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

  .nav-link:hover, .nav-link.active { color: #C9A84C; }
  .nav-link:hover::after, .nav-link.active::after { width: 100%; }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .nav-cart {
    position: relative;
    cursor: pointer;
    color: rgba(245,240,232,0.7);
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
    padding: 10px 28px;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
  }

  .nav-btn-outline {
    background: transparent;
    color: rgba(245,240,232,0.8);
    border: 1px solid rgba(201,168,76,0.4);
  }

  .nav-btn-outline:hover {
    border-color: #C9A84C;
    color: #C9A84C;
  }

  .nav-btn-gold {
    background: #C9A84C;
    color: #0A0A0A;
  }

  .nav-btn-gold:hover {
    background: #E8D5A3;
    transform: translateY(-1px);
  }

  .nav-btn-admin {
    background: #9C27B0;
    color: #fff;
    border: none;
  }

  .nav-btn-admin:hover {
    background: #7B1FA2;
    transform: translateY(-1px);
  }

  .nav-user {
    font-size: 10px;
    letter-spacing: 2px;
    color: #C9A84C;
    font-weight: 500;
    text-transform: uppercase;
  }

  @media (max-width: 768px) {
    .nav-inner { padding: 0 24px; }
    .nav-links { display: none; }
  }
`;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <style>{styles}</style>
      <nav className={`navbar ${scrolled ? "scrolled" : "top"}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-brand">SmartCart</Link>

          <ul className="nav-links">
            {[
              { to: "/", label: "Home" },
              { to: "/products", label: "Products" },
              // ✅ Shfaq Admin link vetëm për admin
              ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`nav-link ${location.pathname === to ? "active" : ""}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-right">
            <Link to="/cart" className="nav-cart">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {isAuthenticated ? (
              <>
                <span className="nav-user">{user?.name?.split(" ")[0]}</span>
                {/* ✅ Shfaq Admin Dashboard buton vetëm për admin */}
                {user?.role === "admin" && (
                  <button
                    className="nav-btn nav-btn-admin"
                    onClick={() => navigate("/admin")}
                  >
                    🛡️ Admin
                  </button>
                )}
                <button className="nav-btn nav-btn-outline" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="nav-btn nav-btn-outline" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="nav-btn nav-btn-gold" onClick={() => navigate("/register")}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}