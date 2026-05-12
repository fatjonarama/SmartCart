import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }

    axios.get(`https://smartcart-ks.up.railway.app/api/v1/users/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#F5F0E8" }}>
        {status === "loading" && <p>Duke verifikuar...</p>}
        {status === "success" && (
          <>
            <h2 style={{ color: "#C9A84C" }}>Email u verifikua me sukses!</h2>
            <p>Po të ridrejtojmë te login...</p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 style={{ color: "#E88080" }}>Token i pavlefshëm!</h2>
            <p>Provo të regjistrohesh sërish.</p>
          </>
        )}
      </div>
    </div>
  );
}
