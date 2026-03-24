const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");

// POST /api/orders - Krijo order të ri
router.post("/", async (req, res) => {
  try {
    const { user_id, total_price, items } = req.body;
    
    const order = await Order.create({ user_id, total_price });

    // Krijo order items
    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      });
    }

    res.status(201).json({ message: "Order created successfully", orderId: order.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders - Shiko të gjitha orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.findAll({ include: OrderItem });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;