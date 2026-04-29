import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email,setEmail]=useState("");const [loading,setLoading]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState("");
  const handleSubmit=async()=>{if(!/\S+@\S+\.\S+/.test(email)){setError("Please enter a valid email.");return;}setLoading(true);setError("");try{await axios.post("http://localhost:5000/api/v1/users/forgot-password",{email});setSent(true);}catch{setError("An error occurred.");}setLoading(false);};
  const s=`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
  .fp-root{min-height:100vh;background:#0A0A0A;display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;padding:20px;}
  .fp-input{width:100%;padding:14px 0;background:transparent;border:none;border-bottom:1px solid rgba(245,240,232,0.15);color:#F5F0E8;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:300;outline:none;transition:border-color 0.3s;box-sizing:border-box;}
  .fp-input:focus{border-bottom-color:#C9A84C;}.fp-input::placeholder{color:rgba(245,240,232,0.2);}
  .fp-btn{width:100%;padding:16px;background:#C9A84C;color:#0A0A0A;border:none;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;margin-top:24px;}
  .fp-btn:hover:not(:disabled){background:#E8D5A3;transform:translateY(-2px);}.fp-btn:disabled{opacity:0.5;cursor:not-allowed;}`;
  return(<><style>{s}</style>
    <div className="fp-root">
      <div style={{width:"100%",maxWidth:"420px"}}>
        <Link to="/" style={{fontFamily:"Cormorant Garamond,serif",fontSize:"28px",fontWeight:"300",color:"#C9A84C",letterSpacing:"6px",textTransform:"uppercase",textDecoration:"none",display:"block",marginBottom:"40px",textAlign:"center"}}>SmartCart</Link>
        {sent?(<div style={{textAlign:"center"}}>
          <div style={{fontSize:"60px",marginBottom:"24px"}}>📧</div>
          <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"32px",fontWeight:"300",color:"#F5F0E8",marginBottom:"12px"}}>Check your <em style={{fontStyle:"italic",color:"#C9A84C"}}>email</em></h2>
          <p style={{fontSize:"13px",color:"#888880",fontWeight:"300",lineHeight:"1.8",marginBottom:"32px"}}>If <strong style={{color:"#C9A84C"}}>{email}</strong> is registered, you will receive a reset link shortly.</p>
          <div style={{padding:"16px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"6px",fontSize:"12px",color:"#888880"}}>ℹ️ Check your spam folder if you don't see it.</div>
          <p style={{textAlign:"center",marginTop:"28px",fontSize:"12px",color:"#888880"}}><Link to="/login" style={{color:"#C9A84C",textDecoration:"none"}}>← Back to Login</Link></p>
        </div>):(<>
          <h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"36px",fontWeight:"300",color:"#F5F0E8",marginBottom:"8px"}}>Forgot your <em style={{fontStyle:"italic",color:"#C9A84C"}}>password?</em></h1>
          <p style={{fontSize:"12px",color:"#888880",marginBottom:"36px",fontWeight:"300",lineHeight:"1.6"}}>Enter your email and we'll send you a reset link.</p>
          {error&&<div style={{padding:"12px 16px",background:"rgba(201,68,68,0.08)",borderLeft:"2px solid #C94444",color:"#E88080",fontSize:"12px",marginBottom:"20px",fontWeight:"300"}}>{error}</div>}
          <label style={{display:"block",fontSize:"9px",fontWeight:"600",letterSpacing:"3px",textTransform:"uppercase",color:"#C9A84C",marginBottom:"10px"}}>Email Address</label>
          <input type="email" className="fp-input" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          <button className="fp-btn" onClick={handleSubmit} disabled={loading}>{loading?"Sending...":"Send Reset Link →"}</button>
          <p style={{textAlign:"center",marginTop:"28px",fontSize:"12px",color:"#888880"}}>Remember? <Link to="/login" style={{color:"#C9A84C",textDecoration:"none",fontWeight:"500"}}>Sign in</Link></p>
        </>)}
      </div>
    </div>
  </>);
}