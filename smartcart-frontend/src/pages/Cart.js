import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-light: #E8D5A3;
    --black: #0A0A0A;
    --dark: #111111;
    --dark2: #1A1A1A;
    --white: #F5F0E8;
    --gray: #888880;
  }

  .cart-root {
    min-height: 100vh;
    background: var(--black);
    font-family: 'Montserrat', sans-serif;
    color: var(--white);
    padding-top: 80px;
  }

  .cart-hero {
    padding: 60px 60px 40px;
    background: var(--dark);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    position: relative;
    overflow: hidden;
  }

  .cart-hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.05) 0%, transparent 60%);
  }

  .cart-hero-label {
    font-size: 10px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative; z-index: 1;
  }

  .cart-hero-label::before {
    content: '';
    width: 30px; height: 1px;
    background: var(--gold); opacity: 0.5;
  }

  .cart-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 300;
    color: var(--white);
    line-height: 1;
    position: relative; z-index: 1;
  }

  .cart-hero-title em { font-style: italic; color: var(--gold); }

  .cart-hero-sub {
    font-size: 12px;
    color: var(--gray);
    margin-top: 12px;
    font-weight: 300;
    letter-spacing: 1px;
    position: relative; z-index: 1;
  }

  .cart-body {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 60px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 32px;
    align-items: start;
  }

  .cart-items { display: flex; flex-direction: column; gap: 2px; }

  .cart-item {
    background: var(--dark);
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: background 0.3s;
    border-left: 2px solid transparent;
  }

  .cart-item:hover {
    background: var(--dark2);
    border-left-color: rgba(201,168,76,0.3);
  }

  .item-image {
    width: 72px; height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 4px;
    border: 1px solid rgba(201,168,76,0.08);
  }

  .item-initial {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 300;
    color: rgba(255,255,255,0.2);
    line-height: 1;
    user-select: none;
  }

  .item-info { flex: 1; }

  .item-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 400;
    color: var(--white);
    margin-bottom: 6px;
  }

  .item-price-unit {
    font-size: 12px;
    color: var(--gray);
    font-weight: 300;
    letter-spacing: 0.5px;
  }

  .item-qty {
    display: flex;
    align-items: center;
    border: 1px solid rgba(201,168,76,0.2);
  }

  .qty-btn {
    width: 36px; height: 36px;
    background: transparent;
    border: none;
    color: var(--gold);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-weight: 300;
  }

  .qty-btn:hover { background: rgba(201,168,76,0.1); }

  .qty-num {
    width: 40px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--white);
    border-left: 1px solid rgba(201,168,76,0.2);
    border-right: 1px solid rgba(201,168,76,0.2);
    line-height: 36px;
  }

  .item-total {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 300;
    color: var(--gold);
    min-width: 90px;
    text-align: right;
  }

  .item-remove {
    background: transparent;
    border: none;
    color: rgba(245,240,232,0.2);
    font-size: 16px;
    cursor: pointer;
    padding: 8px;
    transition: color 0.3s;
    line-height: 1;
  }

  .item-remove:hover { color: #C94444; }

  .cart-summary {
    background: var(--dark);
    border: 1px solid rgba(201,168,76,0.12);
    position: sticky;
    top: 100px;
  }

  .summary-header {
    padding: 28px 32px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }

  .summary-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 300;
    color: var(--white);
  }

  .summary-body { padding: 24px 32px; }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;
    font-size: 12px;
    color: var(--gray);
    font-weight: 300;
  }

  .summary-row span:last-child { color: var(--white); }

  .summary-divider {
    height: 1px;
    background: rgba(201,168,76,0.1);
    margin: 20px 0;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .summary-total-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray);
    font-weight: 500;
  }

  .summary-total-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px;
    font-weight: 300;
    color: var(--gold);
  }

  .summary-footer { padding: 0 32px 32px; }

  .checkout-btn {
    width: 100%;
    padding: 18px;
    background: var(--gold);
    color: var(--black);
    border: none;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 12px;
  }

  .checkout-btn:hover:not(:disabled) {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(201,168,76,0.2);
  }

  .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .continue-btn {
    width: 100%;
    padding: 14px;
    background: transparent;
    color: var(--gray);
    border: 1px solid rgba(245,240,232,0.1);
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
  }

  .continue-btn:hover {
    border-color: rgba(201,168,76,0.3);
    color: var(--gold);
  }

  .cart-empty {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 60px;
  }

  .empty-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px;
    font-weight: 300;
    color: var(--white);
  }

  .empty-sub {
    font-size: 13px;
    color: var(--gray);
    font-weight: 300;
    letter-spacing: 0.5px;
  }

  .shop-btn {
    padding: 14px 40px;
    background: var(--gold);
    color: var(--black);
    border: none;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 8px;
  }

  .shop-btn:hover { background: var(--gold-light); transform: translateY(-2px); }

  .cart-success {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    text-align: center;
    padding: 60px;
  }

  .success-ring {
    width: 100px; height: 100px;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: var(--gold);
    animation: fadeUp 0.6s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: var(--white);
  }

  .success-title em { font-style: italic; color: var(--gold); }

  .success-sub {
    font-size: 13px;
    color: var(--gray);
    font-weight: 300;
    max-width: 400px;
    line-height: 1.8;
  }

  @media (max-width: 900px) {
    .cart-body { grid-template-columns: 1fr; padding: 32px 24px; }
    .cart-hero { padding: 60px 24px 40px; }
    .cart-summary { position: static; }
  }
`;

const cardColors = [
  "#1C1008", "#081C10", "#08101C", "#1C0808",
  "#0F0C18", "#181208", "#0C1818", "#180C18",
];

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }

    // Merr token direkt nga localStorage
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/v1/orders",        {
          total_price: cartTotal.toFixed(2),
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      clearCart();
      setStatus("success");
    } catch (err) {
      console.error("Checkout error:", err.response?.data || err.message);
      setStatus("error");
    }
    setLoading(false);
  };

  if (status === "success") {
    return (
      <>
        <style>{styles}</style>
        <div className="cart-root">
          <div className="cart-success">
            <div className="success-ring">✦</div>
            <h2 className="success-title">Order <em>Confirmed</em></h2>
            <p className="success-sub">
              Thank you for your purchase. Your order has been placed and will be processed shortly.
            </p>
            <button className="shop-btn" onClick={() => navigate("/products")}>
              Continue Shopping →
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="cart-root">

        <div className="cart-hero">
          <div className="cart-hero-bg" />
          <div className="cart-hero-label">Your Selection</div>
          <h1 className="cart-hero-title">Shopping <em>Cart</em></h1>
          <p className="cart-hero-sub">
            {cart.length === 0 ? "Your cart is empty" : `${cart.length} item${cart.length > 1 ? "s" : ""} selected`}
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div style={{ fontSize: "48px", color: "var(--gold)", opacity: 0.2, fontFamily: "'Cormorant Garamond', serif" }}>◇</div>
            <h2 className="empty-title">Your cart is empty</h2>
            <p className="empty-sub">Discover our curated collection of premium products</p>
            <button className="shop-btn" onClick={() => navigate("/products")}>
              Explore Collection →
            </button>
          </div>
        ) : (
          <div className="cart-body">

            <div className="cart-items">
              {cart.map((item, i) => (
                <div key={item.id} className="cart-item">
                  <div
                    className="item-image"
                    style={{ backgroundColor: cardColors[i % cardColors.length] }}
                  >
                    <span className="item-initial">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price-unit">${parseFloat(item.price).toFixed(2)} each</div>
                  </div>
                  <div className="item-qty">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>−</button>
                    <div className="qty-num">{item.quantity}</div>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
                  <button className="item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-header">
                <div className="summary-title">Order Summary</div>
              </div>
              <div className="summary-body">
                {cart.map(item => (
                  <div key={item.id} className="summary-row">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="summary-divider" />
                <div className="summary-total">
                  <div className="summary-total-label">Total</div>
                  <div className="summary-total-amount">${cartTotal.toFixed(2)}</div>
                </div>
              </div>
              <div className="summary-footer">
                {status === "error" && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(201,68,68,0.08)",
                    borderLeft: "2px solid #C94444",
                    color: "#E88080",
                    fontSize: "12px",
                    marginBottom: "16px",
                    fontWeight: "300",
                  }}>
                    Checkout failed. Please try again.
                  </div>
                )}
                <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
                  {loading ? "Processing..." : "Proceed to Checkout →"}
                </button>
                <button className="continue-btn" onClick={() => navigate("/products")}>
                  ← Continue Shopping
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}