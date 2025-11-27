const bufferModule = require("buffer");
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = bufferModule.Buffer;
  global.SlowBuffer = bufferModule.Buffer;
}

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swaggerConfig");
const path = require("path");

const attributeValueRoutes = require("./routes/attributeValueRoutes");
const attributeRoutes = require("./routes/attributeRoute");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cartRoute");
const orderRoutes = require("./routes/orderRoute");
const uploadRoutes = require("./routes/uploadRouter");
const autoloadRoutes = require("./utils/autoload");

dotenv.config();

const app = express();

// ⚠️ ĐÚNG: đặt limit JSON TRÊN HẾT
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// CORS đặt sau JSON (cách an toàn nhất)
app.use(cors());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Simple Route
app.get("/", (req, res) => {
  res.send("Welcome to the Node.js + MongoDB API!");
});

// Routes
app.use("/api/attribute-values", attributeValueRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

autoloadRoutes(app);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static file
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
