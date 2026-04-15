const express = require("express");
const router = express.Router();
const Joi = require("joi");
const NodeCache = require("node-cache");
const Product = require("../models/Product");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Cache 5 minuta
const cache = new NodeCache({ stdTTL: 300 });

// Joi Validation Schema
const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Emri i produktit është i detyrueshëm!",
    "string.min": "Emri duhet të ketë së paku 2 karaktere!",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Çmimi duhet të jetë numër!",
    "number.positive": "Çmimi duhet të jetë pozitiv!",
  }),
  description: Joi.string().max(500).optional(),
  category: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
});

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Menaxhimi i produkteve
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Merr të gjitha produktet
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista e produkteve
 */
router.get("/", async (req, res) => {
  try {
    // CACHING
    const cachedProducts = cache.get("all_products");
    if (cachedProducts) {
      return res.json({
        source: "cache",
        data: cachedProducts,
        _links: {
          self: { href: "/api/v1/products" },
          create: { href: "/api/v1/products", method: "POST" },
        },
      });
    }

    const products = await Product.findAll();
    cache.set("all_products", products);

    // HATEOAS
    res.json({
      source: "database",
      data: products,
      _links: {
        self: { href: "/api/v1/products" },
        create: { href: "/api/v1/products", method: "POST" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Merr një produkt sipas ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produkti u gjet
 *       404:
 *         description: Produkti nuk u gjet
 */
router.get("/:id", async (req, res) => {
  try {
    const cacheKey = `product_${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: "cache",
        data: cached,
        _links: {
          self: { href: `/api/v1/products/${req.params.id}` },
          update: { href: `/api/v1/products/${req.params.id}`, method: "PUT" },
          delete: { href: `/api/v1/products/${req.params.id}`, method: "DELETE" },
          all: { href: "/api/v1/products" },
        },
      });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    cache.set(cacheKey, product);

    // HATEOAS
    res.json({
      source: "database",
      data: product,
      _links: {
        self: { href: `/api/v1/products/${req.params.id}` },
        update: { href: `/api/v1/products/${req.params.id}`, method: "PUT" },
        delete: { href: `/api/v1/products/${req.params.id}`, method: "DELETE" },
        all: { href: "/api/v1/products" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Krijo produkt të ri (vetëm Admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produkti u krijua
 *       400:
 *         description: Të dhëna të pavlefshme
 *       403:
 *         description: Nuk ke leje
 */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.create(req.body);

    // Pastro cache
    cache.del("all_products");

    // HATEOAS
    res.status(201).json({
      message: "✅ Produkti u krijua!",
      data: product,
      _links: {
        self: { href: `/api/v1/products/${product.id}` },
        all: { href: "/api/v1/products" },
        update: { href: `/api/v1/products/${product.id}`, method: "PUT" },
        delete: { href: `/api/v1/products/${product.id}`, method: "DELETE" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Përditëso produkt (vetëm Admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produkti u përditësua
 *       404:
 *         description: Produkti nuk u gjet
 */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    await product.update(req.body);

    // Pastro cache
    cache.del("all_products");
    cache.del(`product_${req.params.id}`);

    // HATEOAS
    res.json({
      message: "✅ Produkti u përditësua!",
      data: product,
      _links: {
        self: { href: `/api/v1/products/${req.params.id}` },
        all: { href: "/api/v1/products" },
        delete: { href: `/api/v1/products/${req.params.id}`, method: "DELETE" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Fshi produkt (vetëm Admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produkti u fshi
 *       404:
 *         description: Produkti nuk u gjet
 */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produkti nuk u gjet!" });

    await product.destroy();

    // Pastro cache
    cache.del("all_products");
    cache.del(`product_${req.params.id}`);

    // HATEOAS
    res.json({
      message: "✅ Produkti u fshi!",
      _links: {
        all: { href: "/api/v1/products" },
        create: { href: "/api/v1/products", method: "POST" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;