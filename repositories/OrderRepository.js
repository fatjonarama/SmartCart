const Order     = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const User      = require("../models/User");
const { Op }    = require("sequelize");

// ══════════════════════════════════════════════════
// ORDER REPOSITORY — Data Access Layer (DDD)
// ══════════════════════════════════════════════════

class OrderRepository {

  // Gjej të gjithë (admin) me pagination + filtering
  async findAll({ page = 1, limit = 10, status, userId, paymentMethod, dateFrom, dateTo } = {}) {
    const where = {};

    if (status)        where.status         = status;
    if (userId)        where.user_id        = userId;
    if (paymentMethod) where.payment_method = paymentMethod;
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo)   where.created_at[Op.lte] = new Date(dateTo);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem },
        { model: User, attributes: ["id","name","email"] },
      ],
      limit:  parseInt(limit),
      offset,
      order:  [["created_at", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total:      count,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  // Gjej porositë e një useri
  async findByUser(userId, { page = 1, limit = 10, status } = {}) {
    const where = { user_id: userId };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: OrderItem,
      limit:  parseInt(limit),
      offset,
      order:  [["created_at", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total:      count,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  // Gjej me ID
  async findById(id) {
    return Order.findByPk(id, {
      include: [
        { model: OrderItem },
        { model: User, attributes: ["id","name","email"] },
      ],
    });
  }

  // Krijo order
  async create({ userId, totalPrice, paymentMethod = "cash" }) {
    return Order.create({
      user_id:        userId,
      total_price:    totalPrice,
      status:         "pending",
      payment_method: paymentMethod,
    });
  }

  // Shto items te order
  async addItems(orderId, items) {
    return Promise.all(items.map(item =>
      OrderItem.create({
        order_id:   orderId,
        product_id: item.product_id,
        quantity:   item.quantity,
        price:      item.price,
      })
    ));
  }

  // Ndrysho statusin
  async updateStatus(id, status, adminNote = null) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    const updateData = { status };
    if (adminNote) updateData.admin_note = adminNote;
    await order.update(updateData);
    return order;
  }

  // Fshi order
  async delete(id) {
    const order = await Order.findByPk(id, { include: OrderItem });
    if (!order) return false;
    await OrderItem.destroy({ where: { order_id: id } });
    await order.destroy();
    return true;
  }

  // Total të ardhura
  async totalRevenue() {
    const { QueryTypes } = require("sequelize");
    const sequelize = require("../config/db");
    const result = await sequelize.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE status != 'cancelled'`,
      { type: QueryTypes.SELECT }
    );
    return result[0]?.revenue || 0;
  }

  // Stats sipas statusit
  async countByStatus() {
    const { QueryTypes } = require("sequelize");
    const sequelize = require("../config/db");
    return sequelize.query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`,
      { type: QueryTypes.SELECT }
    );
  }

  // Numëro total orders
  async count() {
    return Order.count();
  }
}

module.exports = new OrderRepository();