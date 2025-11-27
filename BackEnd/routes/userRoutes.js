const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();
const nodemailer = require("nodemailer");
const roleMiddleware = require("../middlewares/roleMiddleware");
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: This endpoint allows creating a new user without authentication.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       500:
 *         description: Failed to create user
 */
const verificationCodes = new Map();

// Cấu hình gửi email
const transporter = nodemailer.createTransport({
  service: "Gmail", // Hoặc dịch vụ khác
  auth: {
    user: "managingagents.se@gmail.com",
    pass: "gtwdyjnrsuimdojf",
  },
});

// POST /api/users/register
router.post("/register", async (req, res) => {
  const {
    id,
    username,
    password,
    email,
    phoneNumber,
    phone,
    address,
    gender,
    dateOfBirth,
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email da ton tai." });
    }

    const newUser = new User({
      id,
      username,
      password,
      email,
      phoneNumber: phoneNumber || phone || "",
      address: address || "",
      gender: gender || "Other",
      dateOfBirth,
      isActive: true,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "Tao tai khoan thanh cong!", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Loi khi tao tai khoan." });
  }
});

router.post("/addStaff", async (req, res) => {
  const { id, email, username, password, role, phoneNumber } = req.body;

  try {
    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Đã tồn tại email" });
    }
    console.log("HELLO");

    // Tạo người dùng mới
    const newUser = new User({
      id,
      username,
      password,
      role,
      email,
      phoneNumber,
      address: "",
      gender: "Male",
      dateOfBirth: new Date(0),
      isActive: true,
    });

    await newUser.save();

    res.status(201).json({
      message: "Nhân viên mới đã được thêm thành công.",
      user: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi thêm nhân viên mới." });
  }
});

// POST /api/users/verify
router.post("/verify", async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Kiểm tra mã xác thực trong bộ nhớ tạm
    const storedData = verificationCodes.get(email);
    if (!storedData || storedData.verificationCode !== verificationCode) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }

    // Tạo người dùng mới từ dữ liệu lưu trữ
    const {
      id,
      username,
      password,
      phoneNumber,
      address,
      gender,
      dateOfBirth,
    } = storedData.userData;

    const newUser = new User({
      id,
      username,
      password,
      email,
      phoneNumber,
      address,
      gender,
      dateOfBirth,
      isActive: true, // Kích hoạt tài khoản ngay sau khi xác thực
    });

    await newUser.save();

    // Xóa mã xác thực sau khi sử dụng
    verificationCodes.delete(email);

    res
      .status(201)
      .json({ message: "Tài khoản đã được xác thực và tạo thành công!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi xác thực tài khoản." });
  }
});

// POST /api/users/resend-code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra người dùng tồn tại và chưa kích hoạt
    const user = await User.findOne({ email });
    if (!user || user.isActive) {
      return res.status(400).json({
        message: "Email không tồn tại hoặc tài khoản đã được kích hoạt.",
      });
    }

    // Kiểm tra mã xác thực còn lưu trong bộ nhớ tạm
    const existingCode = verificationCodes.get(email);
    if (existingCode) {
      // Nếu mã xác thực vẫn còn, gửi lại mã
      await transporter.sendMail({
        from: "your-email@gmail.com",
        to: email,
        subject: "Mã xác thực mới của bạn",
        text: `Mã xác thực của bạn là: ${existingCode.verificationCode}`,
      });

      return res.status(200).json({
        message: "Mã xác thực đã được gửi lại. Vui lòng kiểm tra email.",
      });
    }

    // Tạo mã xác thực mới nếu không có mã xác thực trước đó
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Lưu mã xác thực mới vào bộ nhớ
    verificationCodes.set(email, { verificationCode, userData: { email } });

    // Gửi mã mới qua email
    await transporter.sendMail({
      from: "your-email@gmail.com",
      to: email,
      subject: "Mã xác thực mới của bạn",
      text: `Mã xác thực của bạn là: ${verificationCode}`,
    });

    res.status(200).json({
      message: "Mã xác thực mới đã được gửi. Vui lòng kiểm tra email.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi gửi lại mã xác thực." });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user information by ID
 *     description: This endpoint allows authenticated users or admin to retrieve user details.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 address:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                 role:
 *                   type: string
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user information
 *     description: This endpoint allows authenticated users or admin to update user details.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "username",
      "email",
      "phoneNumber",
      "address",
      "gender",
      "dateOfBirth",
      "role",
      "avatarUrl"   // 🆕 Cho phép update avatar
    ];

    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Không cho update password ở đây
    if (req.body.password) {
      return res.status(400).json({ message: "Use /password endpoint to update password." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
   

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      updatedUser._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
});


/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Update user's password
 *     description: This endpoint allows authenticated users to update their password.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad request (e.g., new password is too short)
 *       404:
 *         description: User not found
 *       403:
 *         description: Unauthorized (if not the correct user)
 *       500:
 *         description: Internal server error
 */
router.put("/:id/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Basic validation: Ensure new password is provided
  if (!newPassword) {
    return res
      .status(400)
      .json({ message: "Mật khẩu mới không được để trống." });
  }

  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Check if the current password is correct
    // const isMatch = await bcrypt.compare(currentPassword, user.password);
    const password = currentPassword;
    const isMatch = await User.findOne({ password });
    if (!isMatch) {
      return res.status(403).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    console.log("new:: " + newPassword);
    // Hash the new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật mật khẩu" });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get a list of all users
 *     description: This endpoint allows authenticated users or admin to retrieve a list of all users.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   address:
 *                     type: string
 *                   gender:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                   role:
 *                     type: string
 *       403:
 *         description: Access denied
 *       500:
 *         description: Failed to retrieve users
 */
router.get("/", authMiddleware, roleMiddleware("Admin"), async (req, res) => {
  try {
    const users = await User.find(); // Retrieve all users from the database

    if (!users) {
      return res.status(500).json({ message: "Failed to retrieve users" });
    }

    // Check if the user is an admin (optional)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.status(200).json(users); // Return the list of users
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve users" });
  }
});

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Update all users' information
 *     description: This endpoint allows an admin to update details for all users at once.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: All users updated successfully
 *       403:
 *         description: Access denied (if the user is not admin)
 *       500:
 *         description: Failed to update users
 */
router.put("/", authMiddleware, async (req, res) => {
  // Ensure the logged-in user is an admin
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ message: "Access denied" });
  // }

  try {
    // for (const order of orders) {
    //   const updatedOrder = await Order.findByIdAndUpdate(order._id, order, { new: true });
    //   if (updatedOrder) updatedOrders.push(updatedOrder);
    // }

    const userData = req.body;
    const updateduserData = [];
    // Update all users with the provided data
    for (const user of userData) {
      const updateduser = await User.findByIdAndUpdate(user._id, user, {
        new: true,
      });
      if (updateduserData) updateduserData.push(updateduser);
    }

    res.status(200).json({ message: "All users updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update users" });
  }
});

// POST /api/users/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra xem email có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống." });
    }

    // Tạo mã xác thực
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã xác thực vào bộ nhớ tạm
    verificationCodes.set(email, { resetCode, createdAt: Date.now() });

    // Gửi mã xác thực qua email
    await transporter.sendMail({
      from: "your-email@gmail.com",
      to: email,
      subject: "Mã đặt lại mật khẩu",
      text: `Mã đặt lại mật khẩu của bạn là: ${resetCode}. Mã có hiệu lực trong 10 phút.`,
    });

    res
      .status(200)
      .json({ message: "Mã đặt lại mật khẩu đã được gửi qua email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi gửi mã đặt lại mật khẩu." });
  }
});

// POST /api/users/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  try {
    // Kiểm tra mã xác thực trong bộ nhớ
    const storedData = verificationCodes.get(email);
    if (!storedData || storedData.resetCode !== resetCode) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }

    // Kiểm tra thời gian hết hạn (10 phút)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - storedData.createdAt > tenMinutes) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: "Mã xác thực đã hết hạn." });
    }

    // Cập nhật mật khẩu mới
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống." });
    }

    user.password = newPassword; // Cần hash mật khẩu nếu cần
    await user.save();

    // Xóa mã xác thực sau khi sử dụng
    verificationCodes.delete(email);

    res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi đặt lại mật khẩu." });
  }
});

module.exports = router;
