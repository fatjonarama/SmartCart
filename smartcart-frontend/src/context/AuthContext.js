
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    // ✅ Kontrolli mbrojtës: Sigurohemi që storedToken ekziston dhe është string
    if (storedToken && typeof storedToken === "string" && storedToken.includes(".")) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser({ 
            id: payload.id, 
            email: payload.email, 
            name: payload.name,
            role: payload.role 
          });
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (tokenFromServer) => {
    // 🛡️ FIX: Ky kusht ndalon gabimin "Cannot read properties of undefined (reading 'split')"
    if (!tokenFromServer || typeof tokenFromServer !== "string" || !tokenFromServer.includes(".")) {
      console.error("Gabim: Token-i që erdhi nga Login.js është i pavlefshëm!", tokenFromServer);
      return;
    }

    try {
      localStorage.setItem("token", tokenFromServer);
      const payload = JSON.parse(atob(tokenFromServer.split(".")[1]));
      setToken(tokenFromServer);
      setUser({ 
        id: payload.id, 
        email: payload.email, 
        name: payload.name,
        role: payload.role 
      });
    } catch (error) {
      console.error("Gabim gjatë dekodimit të token-it:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth duhet të përdoret brenda AuthProvider");
  return context;
}
