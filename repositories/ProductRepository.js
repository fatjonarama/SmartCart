const Product = require("../models/Product");
const { Op } = require("sequelize");

// ══════════════════════════════════════════════════
// PRODUCT REPOSITORY — Data Access Layer (DDD)
// ══════════════════════════════════════════════════

class ProductRepository {

  // Gjej të gjithë me pagination, search, category, price range
  async findAll({ page = 1, limit = 12, search, category, minPrice, maxPrice, sortBy = "created_at", sortOrder = "DESC" } = {}) {
    const where = {};

    if (search)   where.name     = { [Op.like]: `%${search}%` };
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Validim i sortBy për të shmangur SQL injection
    const allowedSort  = ["created_at", "price", "name", "stock"];
    const allowedOrder = ["ASC", "DESC"];
    const safeSort  = allowedSort.includes(sortBy)   ? sortBy   : "created_at";
    const safeOrder = allowedOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "DESC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit:  parseInt(limit),
      offset,
      order:  [[safeSort, safeOrder]],
    });

    return {
      data: rows,
      pagination: {
        total:      count,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      filters: { search, category, minPrice, maxPrice, sortBy: safeSort, sortOrder: safeOrder },
    };
  }

  // Gjej me ID
  async findById(id) {
    return Product.findByPk(id);
  }

  // Gjej sipas kategorisë
  async findByCategory(category) {
    return Product.findAll({ where: { category }, order: [["created_at", "DESC"]] });
  }

  // Krijo produkt të ri
  async create(data) {
    return Product.create(data);
  }

  // Përditëso produkt
  async update(id, data) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    await product.update(data);
    return product;
  }

  // Fshi produkt
  async delete(id) {
    const product = await Product.findByPk(id);
    if (!product) return false;
    await product.destroy();
    return true;
  }

  // Ul stock-un (me kontroll)
  async decrementStock(id, quantity) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error(`Produkti #${id} nuk u gjet!`);
    if (product.stock < quantity) throw new Error(`"${product.name}" ka vetëm ${product.stock} në stok!`);
    await Product.decrement("stock", { by: quantity, where: { id } });
    return true;
  }

  // Rrit stock-un
  async incrementStock(id, quantity) {
    await Product.increment("stock", { by: quantity, where: { id } });
    return true;
  }

  // Numëro total produktet
  async count() {
    return Product.count();
  }

  // Top produktet e shitura
  async topSelling(limit = 5) {
    const { QueryTypes } = require("sequelize");
    const sequelize = require("../config/db");
    return sequelize.query(`
      SELECT p.id, p.NAME as name, SUM(oi.quantity) as total_sold
      FROM products p
      JOIN orderitems oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.NAME
      ORDER BY total_sold DESC
      LIMIT ${parseInt(limit)}
    `, { type: QueryTypes.SELECT });
  }
}

module.exports = new ProductRepository();