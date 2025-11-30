import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// API endpoint cho việc upload file
const UPLOAD_API_URL = "http://localhost:8081/api/upload";

// Lấy token từ localStorage (giống như userSlice)
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// AsyncThunk để xử lý việc upload file
export const uploadFile = createAsyncThunk(
  "upload/uploadFile",
  async (file, thunkAPI) => {
    try {
      // Convert file → base64 (vì JSON không gửi file binary trực tiếp)
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = reader.result.split(",")[1]; // chỉ lấy phần base64
            resolve(base64);
          };
          reader.onerror = reject;
        });

      const base64Data = await toBase64(file);

      // Lấy token từ localStorage
      const token = getAuthToken();

      // ---- GỬI JSON THAY VÌ MULTIPART VỚI TOKEN ----
      const response = await axios.post(
        UPLOAD_API_URL,
        {
          filename: file.name, // giữ nguyên behavior (chỉ thay body)
          data: base64Data, // base64 content
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Thêm token vào header
          },
        }
      );

      return response.data; // Trả về kết quả từ server
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Slice để quản lý trạng thái upload
const uploadSlice = createSlice({
  name: "upload",
  initialState: {
    file: null, // Thông tin file đã upload
    status: "idle", // Trạng thái: idle | loading | succeeded | failed
    error: null, // Lỗi (nếu có)
  },
  reducers: {}, // Không có reducers đồng bộ cho upload
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.file = action.payload; // Lưu thông tin file từ response
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload; // Lưu lỗi
      });
  },
});

export default uploadSlice.reducer;
