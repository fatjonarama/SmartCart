const nodemailer = require("nodemailer");

// ── Transporter ─────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.mailtrap.io",
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Template helper ──────────────────────────────
const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #F5F5F0; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border: 1px solid rgba(201,168,76,0.2); border-radius: 8px; overflow: hidden; }
    .header { background: #0A0A0A; padding: 32px 40px; text-align: center; }
    .header h1 { color: #C9A84C; font-size: 24px; font-weight: 300; letter-spacing: 4px; margin: 0; }
    .body { padding: 40px; color: #1A1A1A; }
    .body h2 { font-size: 20px; font-weight: 300; color: #1A1A1A; margin-bottom: 16px; }
    .body p { font-size: 13px; color: #555550; line-height: 1.8; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 36px; background: #C9A84C; color: #0A0A0A; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; border-radius: 2px; margin: 20px 0; }
    .footer { padding: 20px 40px; background: #F5F5F0; text-align: center; font-size: 11px; color: #888880; border-top: 1px solid rgba(201,168,76,0.15); }
    .divider { height: 1px; background: rgba(201,168,76,0.15); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>SMARTCART</h1></div>
    <div class="body">
      <h2>${title}</h2>
      <div class="divider"></div>
      ${content}
    </div>
    <div class="footer">© 2024 SmartCart. All rights reserved.<br/>This is an automated message, please do not reply.</div>
  </div>
</body>
</html>`;

// ══════════════════════════════════════════════════
// 1. Email konfirmimi i regjistrimit
// ══════════════════════════════════════════════════
const sendWelcomeEmail = async ({ to, name }) => {
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Welcome to <strong>SmartCart</strong> — your premium shopping destination.</p>
    <p>Your account has been created successfully. You can now log in and start exploring our curated collection of premium products.</p>
    <div class="divider"></div>
    <p style="font-size:11px; color:#888880;">If you did not create this account, please ignore this email.</p>
  `;
  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to SmartCart ✦",
    html:    baseTemplate("Welcome to SmartCart", content),
  });
  console.log(`📧 Welcome email sent to ${to}`);
};

// ══════════════════════════════════════════════════
// 2. Email verifikimi i llogarisë
// ══════════════════════════════════════════════════
const sendVerificationEmail = async ({ to, name, verificationToken }) => {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for registering at <strong>SmartCart</strong>! Please verify your email address to activate your account.</p>
    <div style="text-align:center;">
      <a href="${verifyUrl}" class="btn">Verify My Email</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:11px; color:#888880;">This link expires in <strong>24 hours</strong>. If you did not register, please ignore this email.</p>
    <p style="font-size:11px; color:#888880;">If the button does not work, copy and paste this link:<br/><a href="${verifyUrl}" style="color:#C9A84C;">${verifyUrl}</a></p>
  `;
  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Verify your SmartCart email ✦",
    html:    baseTemplate("Email Verification", content),
  });
  console.log(`📧 Verification email sent to ${to}`);
};

// ══════════════════════════════════════════════════
// 3. Email reset password
// ══════════════════════════════════════════════════
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>We received a request to reset the password for your SmartCart account.</p>
    <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
    <div style="text-align:center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:11px; color:#888880;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    <p style="font-size:11px; color:#888880;">If the button does not work, copy and paste this link:<br/><a href="${resetUrl}" style="color:#C9A84C;">${resetUrl}</a></p>
  `;
  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Reset your SmartCart password",
    html:    baseTemplate("Password Reset Request", content),
  });
  console.log(`📧 Password reset email sent to ${to}`);
};

// ══════════════════════════════════════════════════
// 4. Email konfirmimi i porosisë
// ══════════════════════════════════════════════════
const sendOrderConfirmationEmail = async ({ to, name, orderId, total, items = [], paymentMethod }) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid rgba(201,168,76,0.1); font-size:13px; color:#1A1A1A;">${item.name || `Product #${item.product_id}`}</td>
      <td style="padding:8px 0; border-bottom:1px solid rgba(201,168,76,0.1); font-size:13px; color:#555550; text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0; border-bottom:1px solid rgba(201,168,76,0.1); font-size:13px; color:#C9A84C; text-align:right;">€${parseFloat(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const pmLabels = { cash: "💵 Cash on Delivery", card: "💳 Credit/Debit Card", paypal: "🅿️ PayPal" };

  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for your order! Your order has been received and is being processed.</p>
    <div style="background:#F5F5F0; border:1px solid rgba(201,168,76,0.2); border-radius:4px; padding:20px; margin:20px 0;">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span style="font-size:11px; letter-spacing:2px; color:#888880; text-transform:uppercase;">Order ID</span>
        <span style="font-size:13px; font-weight:600; color:#C9A84C;">#${orderId}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span style="font-size:11px; letter-spacing:2px; color:#888880; text-transform:uppercase;">Payment</span>
        <span style="font-size:13px; color:#1A1A1A;">${pmLabels[paymentMethod] || paymentMethod}</span>
      </div>
    </div>
    ${items.length > 0 ? `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="font-size:10px; letter-spacing:2px; color:#888880; text-transform:uppercase; padding-bottom:8px; text-align:left;">Product</th>
          <th style="font-size:10px; letter-spacing:2px; color:#888880; text-transform:uppercase; padding-bottom:8px; text-align:center;">Qty</th>
          <th style="font-size:10px; letter-spacing:2px; color:#888880; text-transform:uppercase; padding-bottom:8px; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top:12px; font-size:11px; letter-spacing:2px; color:#888880; text-transform:uppercase;">Total</td>
          <td style="padding-top:12px; font-size:20px; color:#C9A84C; text-align:right; font-weight:300;">€${parseFloat(total).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>` : ""}
    <div class="divider"></div>
    <p style="font-size:12px; color:#888880;">Your order will arrive within <strong>24 hours</strong>. You can track it from your account.</p>
  `;

  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Order #${orderId} Confirmed ✦ SmartCart`,
    html:    baseTemplate("Order Confirmed!", content),
  });
  console.log(`📧 Order confirmation email sent to ${to} for order #${orderId}`);
};

// ══════════════════════════════════════════════════
// 5. Email ndryshimi i fjalëkalimit
// ══════════════════════════════════════════════════
const sendPasswordChangedEmail = async ({ to, name }) => {
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Your SmartCart account password has been changed successfully.</p>
    <p>If you did not make this change, please contact us immediately or reset your password.</p>
    <div class="divider"></div>
    <p style="font-size:11px; color:#888880;">Time of change: ${new Date().toLocaleString()}</p>
  `;
  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "SmartCart — Password Changed",
    html:    baseTemplate("Password Changed", content),
  });
  console.log(`📧 Password changed email sent to ${to}`);
};

// ══════════════════════════════════════════════════
// 5. Email verifikimi i llogarisë
// ══════════════════════════════════════════════════
const sendVerificationEmail = async ({ to, name, verificationToken }) => {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for registering at <strong>SmartCart</strong>! Please verify your email address to activate your account.</p>
    <p>Click the button below to verify your email. This link is valid for <strong>24 hours</strong>.</p>
    <div style="text-align:center;">
      <a href="${verifyUrl}" class="btn">Verify Email</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:11px; color:#888880;">If you did not create this account, please ignore this email.</p>
    <p style="font-size:11px; color:#888880;">If the button does not work, copy and paste this link:<br/><a href="${verifyUrl}" style="color:#C9A84C;">${verifyUrl}</a></p>
  `;
  await transporter.sendMail({
    from:    `"SmartCart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Verify your SmartCart email ✦",
    html:    baseTemplate("Email Verification", content),
  });
  console.log(`📧 Verification email sent to ${to}`);
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendPasswordChangedEmail,
  sendVerificationEmail,
};