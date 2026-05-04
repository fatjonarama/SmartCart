import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider }     from "./context/AuthContext";
import { CartProvider }     from "./context/CartContext";
import { ThemeProvider }    from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { WishlistProvider } from "./context/WishlistContext";
import { useTheme }         from "./context/ThemeContext";

import Navbar       from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute   from "./components/AdminRoute";

const Home           = React.lazy(() => import("./pages/Home"));
const Login          = React.lazy(() => import("./pages/Login"));
const Register       = React.lazy(() => import("./pages/Register"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Products       = React.lazy(() => import("./pages/Products"));
const Cart           = React.lazy(() => import("./pages/Cart"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const ProductDetail  = React.lazy(() => import("./pages/ProductDetail"));
const MyOrders       = React.lazy(() => import("./pages/MyOrders"));
const ProfilePage    = React.lazy(() => import("./pages/ProfilePage"));
const WishlistPage   = React.lazy(() => import("./pages/WishlistPage"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));

const LoadingSpinner = () => (
  <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
    <div style={{ width: "44px", height: "44px", border: "1px solid rgba(201,168,76,0.15)", borderTop: "1px solid #C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: "10px", letterSpacing: "5px", color: "#888880", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>Loading...</div>
  </div>
);

function AppContent() {
  const { isDark } = useTheme();
  useEffect(() => {
    document.body.style.background = isDark ? "#0A0A0A" : "#F5F5F0";
    document.body.style.transition = "all 0.3s";
  }, [isDark]);

  return (
    <Router>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/"                 element={<Home />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/products"         element={<Products />} />
          <Route path="/products/:id"     element={<ProductDetail />} />
          <Route path="/cart"             element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/my-orders"        element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="/profile"          element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/wishlist"         element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
          <Route path="/admin"            element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;