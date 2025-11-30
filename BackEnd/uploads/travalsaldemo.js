module.exports = (app) => {
  const Order = require("../models/Order"); // nhớ đổi path đúng theo dự án của bạn

  // Lấy toàn bộ dữ liệu Order

  // Route cũ của bạn
  app.get("/lab-ok12", async (req, res) => {
    try {
      const orders = await Order.find()


      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Lỗi server!",
        error: err.message,
      });
    }
  });
};