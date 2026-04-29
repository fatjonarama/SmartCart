const express   = require("express");
const router    = express.Router();
const Joi       = require("joi");
const Order     = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product   = require("../models/Product");
const User      = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const messageQueue = require("../config/messageQueue");

const productRoutes = require("./productRoutes");

const orderSchema = Joi.object({
  total_price: Joi.number().positive().required().messages({
    "number.base":     "Çmimi total duhet të jetë numër!",
    "number.positive": "Çmimi total duhet të jetë pozitiv!",
    "any.required":    "Çmimi total është i detyrueshëm!",
  }),
  payment_method: Joi.string().valid("cash","card","paypal").optional().default("cash"),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().required(),
    quantity:   Joi.number().integer().min(1).required(),
    price:      Joi.number().positive().required(),
  })).min(1).required().messages({
    "array.min":    "Duhet të ketë të paktën një produkt!",
    "any.required": "Items janë të detyrueshëm!",
  }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending","processing","shipped","delivered","cancelled","exchange","return")
    .required()
});

// Helper — publiko event (i sigurt)
const mqPublish = (queue, data) => {
  try {
    if (messageQueue.sendToQueue) messageQueue.sendToQueue(queue, data);
    else if (messageQueue.publish) messageQueue.publish(queue, data);
  } catch (e) { console.warn("MQ publish failed:", e.message); }
};

// Helper — pastro cache
const flushProductCache = () => {
  try { if (productRoutes.cache) productRoutes.cache.flushAll(); } catch (e) {}
};

// 1. GET ALL (Admin)
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem },
        { model: User, attributes: ["id","name","email"] }
      ],
      order: [["created_at","DESC"]]
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. GET MY ORDERS
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: OrderItem,
      order: [["created_at","DESC"]]
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. CANCEL
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: OrderItem });
    if (!order) return res.status(404).json({ message: "Porosia nuk u gjet!" });
    if (order.user_id !== req.user.id) return res.status(403).json({ message: "Nuk ke leje!" });
    if (!["pending","processing"].includes(order.status))
      return res.status(400).json({ message: `Statusi '${order.status}' nuk mund të anulohet!` });

    for (const item of order.OrderItems || []) {
      await Product.increment("stock", { by: item.quantity, where: { id: item.product_id } });
    }
    await order.update({ status: "cancelled" });
    flushProductCache();
    mqPublish("order.cancelled", { orderId: order.id, userId: req.user.id, timestamp: new Date().toISOString() });
    res.json({ message: "✅ Porosia u anulua!", order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. EXCHANGE REQUEST
router.patch("/:id/exchange", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Porosia nuk u gjet!" });
    if (order.user_id !== req.user.id) return res.status(403).json({ message: "Nuk ke leje!" });
    if (!["pending","processing","shipped","delivered"].includes(order.status))
      return res.status(400).json({ message: `Statusi '${order.status}' nuk lejon ndërrim!` });

    const { reason, note } = req.body;
    if (!reason) return res.status(400).json({ message: "Arsyeja është e detyrueshme!" });

    const adminNote = `[EXCHANGE] Arsyeja: ${reason}${note ? ` | Detaje: ${note}` : ""}`;
    await order.update({ status: "exchange", admin_note: adminNote });
    mqPublish("order.exchange", { orderId: order.id, userId: req.user.id, reason, timestamp: new Date().toISOString() });
    res.json({ message: "✅ Kërkesa u dërgua!", order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. RETURN / DEFECT
router.patch("/:id/return", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Porosia nuk u gjet!" });
    if (order.user_id !== req.user.id) return res.status(403).json({ message: "Nuk ke leje!" });
    if (!["pending","processing","shipped","delivered"].includes(order.status))
      return res.status(400).json({ message: `Statusi '${order.status}' nuk lejon kthim!` });

    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: "Përshkrimi i defektit është i detyrueshëm!" });

    await order.update({ status: "return", admin_note: `[RETURN/DEFECT] ${note}` });
    mqPublish("order.return", { orderId: order.id, userId: req.user.id, note, timestamp: new Date().toISOString() });
    res.json({ message: "✅ Raporti u dërgua!", order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 6. GET BY ID
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: OrderItem });
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });
    if (req.user.role !== "admin" && order.user_id !== req.user.id)
      return res.status(403).json({ message: "Nuk ke leje!" });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 7. CREATE ORDER
router.post("/", protect, async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { total_price, items, payment_method } = req.body;

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product)
        return res.status(404).json({ message: `Produkti #${item.product_id} nuk u gjet!` });
      if (product.stock < item.quantity)
        return res.status(400).json({
          message: `"${product.name}" ka vetëm ${product.stock} në stok. Ke kërkuar ${item.quantity}.`
        });
    }

    const order = await Order.create({
      user_id: req.user.id,
      total_price,
      status: "pending",
      payment_method: payment_method || "cash"
    });

    for (const item of items) {
      await OrderItem.create({
        order_id:   order.id,
        product_id: item.product_id,
        quantity:   item.quantity,
        price:      item.price
      });
      await Product.decrement("stock", { by: item.quantity, where: { id: item.product_id } });
    }

    flushProductCache();
    mqPublish("order.created", {
      orderId: order.id, userId: req.user.id,
      totalPrice: total_price, paymentMethod: payment_method,
      itemCount: items.length, timestamp: new Date().toISOString()
    });

    res.status(201).json({ message: "✅ Order u krijua!", orderId: order.id });
  } catch (err) {
    console.error("❌ ORDER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// 8. UPDATE STATUS (Admin)
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = updateStatusSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  try {
    const order = await Order.findByPk(req.params.id, { include: OrderItem });
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });

    const oldStatus = order.status;
    const newStatus = req.body.status;

    if (newStatus === "cancelled" && !["cancelled"].includes(oldStatus)) {
      for (const item of order.OrderItems || []) {
        await Product.increment("stock", { by: item.quantity, where: { id: item.product_id } });
      }
      flushProductCache();
    }

    await order.update({ status: newStatus });
    mqPublish("order.updated", { orderId: order.id, newStatus, timestamp: new Date().toISOString() });
    res.json({ message: "✅ Order u përditësua!", order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 9. DELETE (Admin)
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: OrderItem });
    if (!order) return res.status(404).json({ message: "Order nuk u gjet!" });

    if (!["cancelled"].includes(order.status)) {
      for (const item of order.OrderItems || []) {
        await Product.increment("stock", { by: item.quantity, where: { id: item.product_id } });
      }
      flushProductCache();
    }

    await OrderItem.destroy({ where: { order_id: order.id } });
    await order.destroy();
    res.json({ message: "✅ Order u fshi!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;