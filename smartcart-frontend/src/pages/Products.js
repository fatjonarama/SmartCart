import React, { useState, useEffect } from "react";
import axios from "axios";

// ============ REVIEWS COMPONENT ============
function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/reviews/product/${productId}`)
      .then((res) => setReviews(res.data))
      .catch((err) => console.error(err));
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment || !username) {
      setMessage("⚠️ Plotësoni të gjitha fushat!");
      return;
    }

    // Merr userId nga token
    const token = localStorage.getItem("token");
    let userId = 1;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id;
      } catch (e) {}
    }

    try {
      const res = await axios.post("http://localhost:5000/api/reviews", {
        productId,
        userId,
        username,
        rating,
        comment,
      });
      setReviews([res.data, ...reviews]);
      setRating(0);
      setComment("");
      setUsername("");
      setMessage("✅ Review u shtua!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Gabim gjatë shtimit!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("A jeni i sigurt?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/reviews/${id}`);
      setReviews(reviews.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div style={{ marginTop: "40px", borderTop: "2px solid #eee", paddingTop: "30px" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "16px" }}>⭐ Reviews</h2>

      {avgRating && (
        <div style={{
          background: "#fff8ee", padding: "12px 20px", borderRadius: "10px",
          display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px",
        }}>
          <span style={{ fontSize: "32px", fontWeight: "bold", color: "#f5a623" }}>{avgRating}</span>
          <span style={{ fontSize: "20px", color: "#f5a623" }}>{"★".repeat(Math.round(avgRating))}</span>
          <span style={{ color: "#888", fontSize: "14px" }}>({reviews.length} reviews)</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: "#f9f9f9", padding: "20px", borderRadius: "12px",
        marginBottom: "24px", border: "1px solid #eee",
      }}>
        <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>Shkruaj një Review</h3>

        <input
          type="text"
          placeholder="Emri juaj"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #ddd", marginBottom: "10px",
            boxSizing: "border-box", fontSize: "14px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                fontSize: "30px", cursor: "pointer",
                color: star <= (hoverRating || rating) ? "#f5a623" : "#ccc",
                transition: "color 0.2s",
              }}
            >★</span>
          ))}
          <span style={{ marginLeft: "8px", color: "#888", fontSize: "13px" }}>
            {rating ? `${rating}/5` : "Zgjidhni rating"}
          </span>
        </div>

        <textarea
          placeholder="Shkruani mendimin tuaj..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #ddd", fontSize: "14px",
            resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
          }}
        />

        {message && (
          <p style={{
            color: message.startsWith("✅") ? "green" : "red",
            fontSize: "13px", margin: "0 0 8px 0",
          }}>{message}</p>
        )}

        <button type="submit" style={{
          background: "linear-gradient(90deg, #e94560, #c0392b)",
          color: "white", border: "none", padding: "10px 24px",
          borderRadius: "30px", cursor: "pointer", fontWeight: "700", fontSize: "14px",
        }}>
          Publiko Review
        </button>
      </form>

      {reviews.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center" }}>Nuk ka reviews akoma. Bëhu i pari! 🙌</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} style={{
            background: "white", border: "1px solid #eee", borderRadius: "12px",
            padding: "16px 20px", marginBottom: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <div>
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>👤 {review.username}</span>
                <span style={{ color: "#f5a623" }}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#aaa", fontSize: "12px" }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <button onClick={() => handleDelete(review._id)} style={{
                  background: "#e74c3c", color: "white", border: "none",
                  padding: "4px 10px", borderRadius: "6px",
                  cursor: "pointer", fontSize: "12px",
                }}>
                  🗑️ Fshi
                </button>
              </div>
            </div>
            <p style={{ color: "#444", margin: 0, lineHeight: "1.5" }}>{review.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ============ PRODUCTS COMPONENT ============
function Products() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products").then((res) => {
      setProducts(res.data);
    });
  }, []);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    setMessage(`✅ "${product.name}" u shtua në cart!`);
    setTimeout(() => setMessage(""), 2500);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63)",
        padding: "60px 40px", textAlign: "center", color: "white",
      }}>
        <h1 style={{ fontSize: "42px", fontWeight: "900", margin: "0 0 12px 0" }}>
          Our Products 🛍️
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", marginBottom: "30px" }}>
          Discover our amazing collection
        </p>
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: "50px",
              border: "none", fontSize: "15px", outline: "none",
              boxSizing: "border-box", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {/* TOAST */}
      {message && (
        <div style={{
          position: "fixed", top: "80px", right: "20px", zIndex: 999,
          background: "#1a1a2e", color: "white", padding: "14px 24px",
          borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          fontWeight: "600", fontSize: "15px", borderLeft: "4px solid #e94560",
        }}>
          {message}
        </div>
      )}

      {/* PRODUCTS GRID */}
      <div style={{ padding: "50px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#888" }}>
            <div style={{ fontSize: "60px" }}>🔍</div>
            <p style={{ fontSize: "18px" }}>No products found</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "28px",
          }}>
            {filtered.map((product) => (
              <div key={product.id} style={{
                background: "white", borderRadius: "20px", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)";
                }}
              >
                <div style={{
                  height: "180px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "64px",
                }}>
                  🛍️
                </div>

                <div style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1a1a2e", fontWeight: "700" }}>
                    {product.name}
                  </h3>
                  <p style={{ color: "#888", fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                    {product.description || "No description available"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "24px", fontWeight: "900", color: "#e94560" }}>
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <button onClick={() => addToCart(product)} style={{
                      padding: "10px 20px",
                      background: "linear-gradient(90deg, #e94560, #c0392b)",
                      color: "white", border: "none", borderRadius: "30px",
                      fontSize: "14px", fontWeight: "700", cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(233,69,96,0.3)", transition: "transform 0.2s",
                    }}
                      onMouseOver={e => e.target.style.transform = "scale(1.05)"}
                      onMouseOut={e => e.target.style.transform = "scale(1)"}
                    >
                      + Add to Cart
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                    style={{
                      marginTop: "12px", width: "100%", padding: "8px",
                      background: "transparent", border: "2px solid #667eea",
                      borderRadius: "30px", color: "#667eea", cursor: "pointer",
                      fontWeight: "600", fontSize: "13px", transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.target.style.background = "#667eea"; e.target.style.color = "white"; }}
                    onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = "#667eea"; }}
                  >
                    {selectedProduct?.id === product.id ? "▲ Mbyll Reviews" : "⭐ Shiko Reviews"}
                  </button>
                </div>

                {selectedProduct?.id === product.id && (
                  <div style={{ padding: "0 20px 20px 20px" }}>
                    <Reviews productId={product.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;