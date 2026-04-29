const amqp = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        // Përdor URL-në që vendose te .env
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        
        // Krijojmë radhën (queue) për porositë - Pika 2.2
        await channel.assertQueue('order_queue', { durable: true });
        
        console.log("✅ RabbitMQ u lidh me sukses në CloudAMQP!");
    } catch (error) {
        console.error("❌ Gabim gjatë lidhjes me RabbitMQ:", error.message);
    }
};

// Funksioni për të dërguar mesazhe asinkrone
const sendToQueue = async (queue, message) => {
    if (!channel) {
        console.error("❌ RabbitMQ Channel nuk është gati!");
        return;
    }
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`✉️ [MQ] Mesazhi u dërgua te: ${queue}`);
};

// Eksportojmë funksionet që përdoren te app.js dhe te controller-at
module.exports = { connectRabbitMQ, sendToQueue };