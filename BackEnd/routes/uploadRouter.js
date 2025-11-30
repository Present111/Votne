const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
// Upload dir fix
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("===== NEW REQUEST =====");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const filename = req.body?.filename || "file.bin";
    console.log("Raw filename:", filename);

    const safeName = filename; // để test traversal

    //const safeName = path.basename(filename)
    console.log("Safe filename:", safeName);

    const savePath = path.join(uploadDir, safeName);
    console.log("Save path:", savePath);

    if (!req.body?.data) {
      console.log("❌ Missing data field");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileBuffer = Buffer.from(req.body.data, "base64");
    console.log("File buffer size:", fileBuffer.length, "bytes");

    const dirPath = path.dirname(savePath);
    console.log("Dir path:", dirPath);

    if (!fs.existsSync(dirPath)) {
      console.log("Dir does not exist → creating…");
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(savePath, fileBuffer);
    console.log("✔ File written successfully");

    // 🟢 🟢 🟢 RESPONSE GIỐNG BẢN CŨ 🟢 🟢 🟢
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${safeName}`;

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      data: {
        fieldname: "image",
        originalname: safeName,
        mimetype: "application/octet-stream",
        size: fileBuffer.length,
        path: fileUrl,
        filename: `uploads/${path.parse(safeName).name}`,
      },
    });
  } catch (err) {
    console.log("❌ ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: err.message,
    });
  }
});

module.exports = router;
