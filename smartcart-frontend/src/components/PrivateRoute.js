import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Prit derisa AuthContext të lexojë token-in nga localStorage
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63)",
        color: "white", fontSize: "18px", fontFamily: "'Segoe UI', sans-serif",
      }}>
        Duke u ngarkuar...
      </div>
    );
  }

  // Nëse nuk është i loguar, ridrejto te /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nëse është i loguar, shfaq faqen
  return children;
}

export default PrivateRoute;
