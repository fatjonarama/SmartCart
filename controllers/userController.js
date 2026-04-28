const User = require('../models/User'); // Sigurohu që emri i modelit është i saktë
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * @desc    Regjistrimi i një përdoruesi të ri dhe dërgimi i email-it
 * @route   POST /api/v1/users/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Kontrollo nëse përdoruesi ekziston në DB (MySQL)
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: "Ky email është i regjistruar paraprakisht!" 
            });
        }

        // 2. Krijo përdoruesin e ri
        const user = await User.create({
            name,
            email,
            password, // Në hapat tjerë këtu do të shtojmë hashing (bcrypt)
            role: role || 'user'
        });

        // 3. DËRGIMI I EMAIL-IT TË MIRËSEARDHJES
        // Përdorim try/catch të brendshëm që nëse dështon emaili, mos të bllokohet regjistrimi
        try {
            await sendWelcomeEmail(user.email, user.name);
            console.log(`✅ Email-i i mirëseardhjes u dërgua te: ${user.email}`);
        } catch (mailError) {
            console.error("❌ Gabim gjatë dërgimit të email-it:", mailError.message);
            // Nuk kthejmë error 500 këtu, sepse user-i u krijua me sukses në DB
        }

        // 4. Përgjigjja e suksesit
        res.status(201).json({
            success: true,
            message: "Përdoruesi u regjistrua me sukses!",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("❌ Gabim në registerUser:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Ka ndodhur një gabim në server gjatë regjistrimit." 
        });
    }
};