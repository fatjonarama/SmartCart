const express = require("express");
const router = express.Router();
const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ Redis i aktivizuar
const { redisClient } = require("../config/redis");

// ── MULTER CONFIG ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/products";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `product_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── SCHEMAS ──────────────────────────────────────────
const productSchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  price:       Joi.number().positive().required(),
  description: Joi.string().max(500).optional().allow(""),
  category:    Joi.string().optional().allow(""),
  stock:       Joi.number().integer().min(0).optional(),
});

const updateProductSchema = Joi.object({
  name:        Joi.string().min(2).max(100).optional(),
  price:       Joi.number().positive().optional(),
  description: Joi.string().max(500).optional().allow(""),
  category:    Joi.string().optional().allow(""),
  stock:       Joi.number().integer().min(0).optional(),
});

// ── Helper: Cache invalidation ───────────────────────
const clearProductsCache = async () => {
  try {
    const keys = await redisClient.keys('products_query_*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Cache pastruar: ${keys.length} keys`);
    }
  } catch (err) {
    console.error('Cache clear error:', err.message);
  }
};

// ── 1. GET ALL ───────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const cacheKey = `products_query_${JSON.stringify(req.query)}`;

    // Kontrollo Redis
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('⚡ Cache HIT - Redis');
        return res.json({
          source: "Redis Cache",
          ...JSON.parse(cachedData)
        });
      }
    }

    console.log('🗄️ Cache MISS - Database');

    const where = {};
    if (search)   where.name = { [Op.like]: `%${search}%` };
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit:  limitNum,
      offset: offset,
      order:  [["created_at", "DESC"]]
    });

    const result = {
      data: rows,
      pagination: {
        totalItems:   count,
        currentPage:  pageNum,
        totalPages:   Math.ceil(count / limitNum),
        itemsPerPage: limitNum
      }
    };

    // Ruaj në Redis — TTL 1 orë
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
    }

    res.json({ source: "Database", ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── 2. GET BY ID ─────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const cacheKey = `product_${req.params.id}`;

    // Kontrollo Redis
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`⚡ Cache HIT - product ${req.params.id}`);
        return res.json({ source: "Redis Cache", data: JSON.parse(cached) });
      }
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    // Ruaj në Redis
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
    }

    res.json({ source: "Database", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── 3. CREATE (Admin Only) ───────────────────────────
router.post("/", protect, authorizeRoles("admin"), upload.single("image"), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const image_url = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`
      : null;

    const product = await Product.create({ ...req.body, image_url });

    // Pastro cache
    await clearProductsCache();

    res.status(201).json({ message: "✅ Produkti u krijua!", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── 4. UPDATE (Admin Only) ───────────────────────────
router.put("/:id", protect, authorizeRoles("admin"), upload.single("image"), async (req, res) => {
  const { error } = updateProductSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    const updateData = { ...req.body };

    if (req.file) {
      if (product.image_url) {
        const oldPath = path.join("uploads/products", path.basename(product.image_url));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image_url = `${req.protocol}://${req.get("host")}/uploads/products/${req.file.filename}`;
    }

    await product.update(updateData);

    // Pastro cache
    await clearProductsCache();
    if (redisClient.isReady) {
      await redisClient.del(`product_${req.params.id}`);
    }

    res.json({ message: "✅ Produkti u përditësua!", data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── 5. DELETE (Admin Only) ───────────────────────────
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    if (product.image_url) {
      const imgPath = path.join("uploads/products", path.basename(product.image_url));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await product.destroy();

    // Pastro cache
    await clearProductsCache();
    if (redisClient.isReady) {
      await redisClient.del(`product_${req.params.id}`);
    }

    res.json({ message: "✅ Produkti u fshi me sukses!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;