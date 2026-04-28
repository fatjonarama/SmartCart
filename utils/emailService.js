const nodemailer = require("nodemailer");

// ✅ E ndryshojmë emrin në sendWelcomeEmail që të përputhet me userRoutes
const sendWelcomeEmail = async (email, name) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"SmartCart" <no-reply@smartcart.com>',
    to: email,
    subject: "Mirësevini në SmartCart!",
    text: `Përshëndetje ${name}, mirësevini në platformën tonë!`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2ecc71;">Mirësevini, ${name}!</h2>
        <p>Jemi shumë të lumtur që u bëtë pjesë e <b>SmartCart</b>.</p>
        <p>Tani mund të filloni të eksploroni produktet tona.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ E eksportojmë si objekt me kllapa gjarpëruese
module.exports = { sendWelcomeEmail };