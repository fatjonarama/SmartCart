import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("smartcart_wishlist")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("smartcart_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist     = (p) => setWishlist(prev => prev.find(x => x.id === p.id) ? prev : [...prev, p]);
  const removeFromWishlist = (id) => setWishlist(prev => prev.filter(p => p.id !== id));
  const toggleWishlist    = (p) => setWishlist(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]);
  const isInWishlist      = (id) => wishlist.some(p => p.id === id);
  const clearWishlist     = () => setWishlist([]);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
