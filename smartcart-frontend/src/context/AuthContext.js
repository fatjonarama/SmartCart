import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          // ✅ SHTOHET role
          setUser({ 
            id: payload.id, 
            email: payload.email, 
            name: payload.name,
            role: payload.role
          });
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (tokenFromServer) => {
    localStorage.setItem("token", tokenFromServer);
    const payload = JSON.parse(atob(tokenFromServer.split(".")[1]));
    setToken(tokenFromServer);
    // ✅ SHTOHET role
    setUser({ 
      id: payload.id, 
      email: payload.email, 
      name: payload.name,
      role: payload.role
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth duhet të përdoret brenda AuthProvider");
  return context;
}