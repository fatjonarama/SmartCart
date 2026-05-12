const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { Op } = require("sequelize"); 
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { redisClient } = require("../config/redis");

const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().max(500).optional().allow(""),
  category: Joi.string().optional().allow(""),
  stock: Joi.number().integer().min(0).optional(),
  image_url: Joi.string().uri().optional().allow("", null),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  price: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional().allow(""),
  category: Joi.string().optional().allow(""),
  stock: Joi.number().integer().min(0).optional(),
  image_url: Joi.string().uri().optional().allow("", null),
});

router.get("/", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const cacheKey = `products_query_${JSON.stringify(req.query)}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json({ source: "Redis Cache", ...JSON.parse(cachedData) });
      }
    } catch (redisErr) {
      console.error("Redis Get Error:", redisErr);
    }

    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [["created_at", "DESC"]]
    });

    const result = {
      data: rows,
      pagination: {
        totalItems: count,
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        itemsPerPage: limitNum
      }
    };

    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(result));
    } catch (redisErr) {
      console.error("Redis Set Error:", redisErr);
    }

    res.json({ source: "Database", ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const cacheKey = `product_${req.params.id}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json({ source: "Redis Cache", data: JSON.parse(cached) });
    } catch (redisErr) {
      console.error("Redis Get Error:", redisErr);
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(product));
    } catch (redisErr) {
      console.error("Redis Set Error:", redisErr);
    }

    res.json({ source: "Database", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.create({ ...req.body });
    try { await redisClient.flushAll(); } catch (e) {}
    res.status(201).json({ message: "✅ Produkti u krijua!", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = updateProductSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    await product.update({ ...req.body });
    try { await redisClient.flushAll(); } catch (e) {}
    res.json({ message: "✅ Produkti u përditësua!", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    await product.destroy();
    try { await redisClient.flushAll(); } catch (e) {}
    res.json({ message: "✅ Produkti u fshi me sukses!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;