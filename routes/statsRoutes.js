const express = require("express");
const router = express.Router();
const sequelize = require("../config/db");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const logger = require("../config/logger");
const createBreaker = require("../middleware/circuitBreaker");

const fetchOverviewData = async () => {
  const [totalUsers]    = await sequelize.query("SELECT COUNT(*) as total FROM Users");
  const [totalProducts] = await sequelize.query("SELECT COUNT(*) as total FROM Products");
  const [totalOrders]   = await sequelize.query("SELECT COUNT(*) as total FROM Orders");
  const [totalRevenue]  = await sequelize.query("SELECT SUM(total_price) as revenue FROM Orders");
  const [ordersByStatus] = await sequelize.query("SELECT status, COUNT(*) as count FROM Orders GROUP BY status");
  const [topProducts] = await sequelize.query(`
    SELECT p.NAME as name, SUM(oi.quantity) as total_sold
    FROM OrderItems oi
    JOIN Products p ON oi.product_id = p.id
    GROUP BY p.id, p.NAME
    ORDER BY total_sold DESC
    LIMIT 5
  `);
  return {
    totalUsers:    totalUsers[0].total,
    totalProducts: totalProducts[0].total,
    totalOrders:   totalOrders[0].total,
    totalRevenue:  totalRevenue[0].revenue || 0,
    ordersByStatus,
    topProducts
  };
};

const overviewBreaker = createBreaker(fetchOverviewData);

router.get("/overview", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const data = await overviewBreaker.fire();
    logger.info(`Admin stats requested by user ${req.user.id}`);
    res.json({
      ...data,
      _links: {
        self:     { href: "/api/v1/stats/overview" },
        users:    { href: "/api/v1/users" },
        orders:   { href: "/api/v1/orders" },
        products: { href: "/api/v1/products" },
      },
    });
  } catch (err) {
    logger.error(`Stats error: ${err.message}`);
    res.status(503).json({ 
      message: "Shërbimi i statistikave është përkohësisht jashtë pune.",
      error: "Circuit Breaker Active" 
    });
  }
});

const fetchMonthlyData = async () => {
  const [results] = await sequelize.query(`
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as total_orders,
      SUM(total_price) as revenue
    FROM Orders
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  return results;
};

const monthlyBreaker = createBreaker(fetchMonthlyData);

router.get("/orders-by-month", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const data = await monthlyBreaker.fire();
    res.json({
      data,
      _links: {
        self:     { href: "/api/v1/stats/orders-by-month" },
        overview: { href: "/api/v1/stats/overview" },
      },
    });
  } catch (err) {
    res.status(503).json({ message: "Gabim në gjenerimin e raportit." });
  }
});

module.exports = router;