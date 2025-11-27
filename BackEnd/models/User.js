const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  address: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  dateOfBirth: { type: Date },
  role: { type: String, enum: ["Customer", "Admin", "Seller", "WarehouseStaff"], default: "Customer" },
  isActive: { type: Boolean, default: true },

  // 🆕 Avatar URL
  avatarUrl: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash mật khẩu trước khi save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
