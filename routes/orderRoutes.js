const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const messageQueue = require("../config/messageQueue");

const orderSchema = Joi.object({
  total_price: Joi.number().positive().required().messages({
    "number.base": "Çmimi total duhet të jetë numër!",
    "number.positive": "Çmimi total duhet të jetë pozitiv!",
    "any.required": "Çmimi total është i detyrueshëm!",
  }),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Duhet të ketë të paktën një produkt në order!",
      "any.required": "Items janë të detyrueshëm!",
    }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .required()
    .messages({
      "any.only": "Statusi duhet të jetë: pending, processing, shipped, delivered, ose cancelled!",
      "any.required": "Statusi është i detyrueshëm!",
    }),
});

// 1. GET ALL ORDERS (Admin)
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const orders = await Order.findAll({ include: OrderItem });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET MY ORDERS (User)
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: OrderItem,
      order: [["created_at", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ✅ CANCEL ORDER — PARA /:id për të mos u kapur si ID
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Porosia nuk u gjet!" });

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Nuk ke leje ta anulosh këtë porosi!" });
    }

    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        message: `Porosia me status '${order.status}' nuk mund të anulohet!`
      });
    }

    await order.update({ status: "cancelled" });

    messageQueue.publish("order.cancelled", {
      orderId: order.id,
      userId: req.user.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "✅ Porosia u anulua!", order });
  } catch (err) {
    console.error("❌ CANCEL ORDER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 4. GET ORDER BY ID
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: OrderItem });
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Nuk ke leje ta shohësh këtë order!" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. CREATE ORDER
router.post("/", protect, async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const user_id = req.user.id;
    const { total_price, items } = req.body;

    const order = await Order.create({
      user_id,
      total_price,
      status: "pending"
    });

    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      });
    }

    messageQueue.publish("order.created", {
      orderId: order.id,
      userId: user_id,
      totalPrice: total_price,
      itemCount: items.length,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "✅ Order u krijua me sukses!",
      orderId: order.id
    });
  } catch (err) {
    console.error("❌ ORDER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 6. UPDATE ORDER STATUS (Admin)
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = updateStatusSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });
    await order.update({ status: req.body.status });

    messageQueue.publish("order.updated", {
      orderId: order.id,
      newStatus: req.body.status,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "✅ Order u përditësua!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. DELETE ORDER (Admin)
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });
    await OrderItem.destroy({ where: { order_id: order.id } });
    await order.destroy();
    res.json({ message: "✅ Order u fshi!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;