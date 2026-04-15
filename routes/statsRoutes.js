const express = require("express");
const router = express.Router();
const sequelize = require("../config/db");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const logger = require("../config/logger");

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistikat e sistemit (vetëm Admin)
 */

/**
 * @swagger
 * /stats/overview:
 *   get:
 *     summary: Merr statistikat e përgjithshme (vetëm Admin)
 *     tags: [Stats]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistikat e sistemit
 *       403:
 *         description: Nuk ke leje admin
 */
router.get("/overview", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const [totalUsers] = await sequelize.query(
      "SELECT COUNT(*) as total FROM users"
    );
    const [totalProducts] = await sequelize.query(
      "SELECT COUNT(*) as total FROM products"
    );
    const [totalOrders] = await sequelize.query(
      "SELECT COUNT(*) as total FROM orders"
    );
    const [totalRevenue] = await sequelize.query(
      "SELECT SUM(total_price) as revenue FROM orders"
    );
    const [ordersByStatus] = await sequelize.query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );
    const [topProducts] = await sequelize.query(`
      SELECT p.NAME as name, SUM(oi.quantity) as total_sold
      FROM orderitems oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.NAME
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    logger.info(`Admin stats requested by user ${req.user.id}`);

    res.json({
      totalUsers: totalUsers[0].total,
      totalProducts: totalProducts[0].total,
      totalOrders: totalOrders[0].total,
      totalRevenue: totalRevenue[0].revenue || 0,
      ordersByStatus,
      topProducts,
      _links: {
        self: { href: "/api/v1/stats/overview" },
        users: { href: "/api/v1/users" },
        orders: { href: "/api/v1/orders" },
        products: { href: "/api/v1/products" },
      },
    });
  } catch (err) {
    logger.error(`Stats error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /stats/orders-by-month:
 *   get:
 *     summary: Merr orders sipas muajit (vetëm Admin)
 *     tags: [Stats]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Orders grupuar sipas muajit
 */
router.get("/orders-by-month", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total_orders,
        SUM(total_price) as revenue
      FROM orders
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      data: results,
      _links: {
        self: { href: "/api/v1/stats/orders-by-month" },
        overview: { href: "/api/v1/stats/overview" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;