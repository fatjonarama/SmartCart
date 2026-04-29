// ══════════════════════════════════════════════════
// PRODUCT SERVICE — Business Logic Layer (DDD)
// ══════════════════════════════════════════════════
const productRepo = require("../repositories/ProductRepository");
const path = require("path");
const fs   = require("fs");

class ProductService {

  // Merr të gjitha me filtering + pagination
  async getAll(filters) {
    return productRepo.findAll(filters);
  }

  // Merr me ID
  async getById(id) {
    const product = await productRepo.findById(id);
    if (!product) throw new Error("Produkti nuk u gjet!");
    return product;
  }

  // Krijo produkt (admin)
  async create(data, file, protocol, host) {
    const image_url = file
      ? `${protocol}://${host}/uploads/products/${file.filename}`
      : null;
    return productRepo.create({ ...data, image_url });
  }

  // Përditëso produkt (admin)
  async update(id, data, file, protocol, host) {
    const product = await productRepo.findById(id);
    if (!product) throw new Error("Produkti nuk u gjet!");

    const updateData = { ...data };

    if (file) {
      // Fshi imazhin e vjetër
      if (product.image_url) {
        const oldPath = path.join("uploads/products", path.basename(product.image_url));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image_url = `${protocol}://${host}/uploads/products/${file.filename}`;
    }

    return productRepo.update(id, updateData);
  }

  // Fshi produkt (admin)
  async delete(id) {
    const product = await productRepo.findById(id);
    if (!product) throw new Error("Produkti nuk u gjet!");

    if (product.image_url) {
      const oldPath = path.join("uploads/products", path.basename(product.image_url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    return productRepo.delete(id);
  }

  // Valido stock para order-it
  async validateStock(items) {
    for (const item of items) {
      const product = await productRepo.findById(item.product_id);
      if (!product) throw new Error(`Produkti #${item.product_id} nuk u gjet!`);
      if (product.stock < item.quantity) {
        throw new Error(`"${product.name}" ka vetëm ${product.stock} në stok. Ke kërkuar ${item.quantity}.`);
      }
    }
    return true;
  }

  // Ul stock-un
  async decrementStock(items) {
    for (const item of items) {
      await productRepo.decrementStock(item.product_id, item.quantity);
    }
  }

  // Rrit stock-un (anulim/kthim)
  async incrementStock(items) {
    for (const item of items) {
      await productRepo.incrementStock(item.product_id || item.product_id, item.quantity);
    }
  }

  // Top 5 produktet
  async topSelling(limit = 5) {
    return productRepo.topSelling(limit);
  }
}

// ══════════════════════════════════════════════════
// ORDER SERVICE — Business Logic Layer (DDD)
// ══════════════════════════════════════════════════
const orderRepo   = require("../repositories/OrderRepository");
const emailService = require("./emailService");
const User        = require("../models/User");

class OrderService {

  // Merr të gjitha (admin) me filtering + pagination
  async getAll(filters) {
    return orderRepo.findAll(filters);
  }

  // Merr porositë e userit
  async getMyOrders(userId, filters) {
    return orderRepo.findByUser(userId, filters);
  }

  // Merr me ID
  async getById(id, requestingUser) {
    const order = await orderRepo.findById(id);
    if (!order) throw new Error("Order nuk u gjet!");

    // Business rule: vetëm admini ose pronari mund ta shohë
    if (requestingUser.role !== "admin" && order.user_id !== requestingUser.id) {
      throw new Error("Nuk ke leje!");
    }
    return order;
  }

  // Krijo order
  async create({ userId, totalPrice, paymentMethod, items }, ip) {
    // Business rule: valido stock
    const productService = new ProductService();
    await productService.validateStock(items);

    // Krijo order
    const order = await orderRepo.create({ userId, totalPrice, paymentMethod });

    // Shto items
    await orderRepo.addItems(order.id, items);

    // Ul stock-un
    await productService.decrementStock(items);

    // Dërgo email konfirmimi
    try {
      const user = await User.findByPk(userId);
      if (user) {
        await emailService.sendOrderConfirmationEmail({
          to:            user.email,
          name:          user.name,
          orderId:       order.id,
          total:         totalPrice,
          items,
          paymentMethod,
        });
      }
    } catch (e) { console.warn("⚠️ Order email failed:", e.message); }

    return order;
  }

  // Ndrysho status (admin)
  async updateStatus(id, newStatus) {
    const order = await orderRepo.findById(id);
    if (!order) throw new Error("Order nuk u gjet!");

    const oldStatus = order.status;

    // Business rule: nëse anulohet, kthe stock-un
    if (newStatus === "cancelled" && oldStatus !== "cancelled") {
      const productService = new ProductService();
      await productService.incrementStock(order.OrderItems || []);
    }

    return orderRepo.updateStatus(id, newStatus);
  }

  // Anulo order (user)
  async cancel(orderId, userId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Porosia nuk u gjet!");
    if (order.user_id !== userId) throw new Error("Nuk ke leje!");
    if (!["pending","processing"].includes(order.status)) {
      throw new Error(`Statusi '${order.status}' nuk mund të anulohet!`);
    }

    // Kthe stock-un
    const productService = new ProductService();
    await productService.incrementStock(order.OrderItems || []);

    return orderRepo.updateStatus(orderId, "cancelled");
  }

  // Exchange request
  async requestExchange(orderId, userId, { reason, note }) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Porosia nuk u gjet!");
    if (order.user_id !== userId) throw new Error("Nuk ke leje!");
    if (!reason) throw new Error("Arsyeja është e detyrueshme!");

    const adminNote = `[EXCHANGE] Arsyeja: ${reason}${note ? ` | Detaje: ${note}` : ""}`;
    return orderRepo.updateStatus(orderId, "exchange", adminNote);
  }

  // Return/Defect request
  async requestReturn(orderId, userId, { note }) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new Error("Porosia nuk u gjet!");
    if (order.user_id !== userId) throw new Error("Nuk ke leje!");
    if (!note?.trim()) throw new Error("Përshkrimi i defektit është i detyrueshëm!");

    return orderRepo.updateStatus(orderId, "return", `[RETURN/DEFECT] ${note}`);
  }

  // Fshi order (admin)
  async delete(id) {
    const order = await orderRepo.findById(id);
    if (!order) throw new Error("Order nuk u gjet!");

    // Kthe stock nëse nuk ishte anuluar
    if (order.status !== "cancelled") {
      const productService = new ProductService();
      await productService.incrementStock(order.OrderItems || []);
    }

    return orderRepo.delete(id);
  }
}

module.exports = {
  productService: new ProductService(),
  orderService:   new OrderService(),
};