import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Typography,
} from "antd";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { validateUserInfoModule } from "../../../modules/validateUserInfoModule";
import { uploadFile } from "../../../redux/Slicer/uploadSlice";
import { fetchUserById, updateUser } from "../../../redux/Slicer/userSlice";

const { Title } = Typography;

const Container = styled.div`
  max-width: 650px;
  margin: 0 auto;
  padding: 20px;
`;

const AvatarWrapper = styled.div`
  text-align: center;
  margin-bottom: 25px;
`;

const AvatarBox = styled.div`
  display: inline-block;
  padding: 5px;
  border-radius: 50%;
  background: linear-gradient(45deg, #1da0f1, #d3541b);
`;

const AvatarImg = styled.img`
  width: 145px;
  height: 145px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
  transition: 0.25s ease-in-out;

  &:hover {
    transform: scale(1.05);
  }
`;

const UploadInput = styled.input`
  margin-top: 10px;
`;

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 15px;
  background-color: #1da0f1;
  color: #fff;

  &:hover {
    background-color: #d3541b;
  }
`;

const AccountInfoComponent = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [errorMessage, setErrorMessage] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);

  // 👉 Avatar preview
  const [avatarPreview, setAvatarPreview] = useState("");

  const { user } = useSelector((state) => state.user);

  // 👉 Lấy userId
  const token = localStorage.getItem("token");
  const decodedToken = token ? jwtDecode(token) : {};
  const userId = decodedToken?.userId;

  // Load user info
  useEffect(() => {
    if (userId) dispatch(fetchUserById(userId));
  }, [dispatch, userId]);

  // Fill form khi user load xong
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        phoneNumber: user.phoneNumber,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null,
      });

      // Set avatar ban đầu
      setAvatarPreview(user.avatarUrl || "");
    }
  }, [user, form]);

  // 🔥 Upload avatar CHỈ để preview
  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarLoading(true);

    const result = await dispatch(uploadFile(file));

    if (uploadFile.fulfilled.match(result)) {
      const rawUrl = result.payload.data.path;
      const safeUrl = encodeURI(rawUrl);

      // 👉 Preview ảnh nhưng chưa lưu DB
      setAvatarPreview(safeUrl);

      message.success("Upload ảnh thành công! Nhớ bấm CẬP NHẬT để lưu.");
    } else {
      message.error("Upload ảnh thất bại!");
    }

    setAvatarLoading(false);
  };

  // Update thông tin user + lưu avatar mới
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      // Validate
      if (
        !validateUserInfoModule(
          values.username,
          values.phoneNumber,
          user.email,
          values.address,
          values.dateOfBirth,
          values.gender
        )
      )
        return;

      await dispatch(
        updateUser({
          userId,
          userData: {
            ...values,
            avatarUrl: avatarPreview, // 👉 Lưu avatar vào DB
            dateOfBirth: values.dateOfBirth
              ? values.dateOfBirth.toISOString()
              : null,
          },
        })
      ).unwrap();

      // 👉 Lưu avatar vào localStorage để Header xài
      localStorage.setItem("avatarUrl", avatarPreview);

      message.success("Cập nhật thông tin thành công!");

      window.location.reload();
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại!");
    }
  };

  return (
    <Container>
      <Title level={3}>Thông tin tài khoản</Title>

      {/* Avatar */}
      <AvatarWrapper>
        <AvatarBox>
          <AvatarImg
            src={avatarPreview || "/default-avatar.png"}
            alt="avatar"
          />
        </AvatarBox>

        <UploadInput type="file" accept="*" onChange={handleUploadAvatar} />
        {avatarLoading && <p>Đang tải ảnh...</p>}
      </AvatarWrapper>

      <Form form={form} layout="vertical">
        <Form.Item label="Họ tên" name="username">
          <Input placeholder="Họ tên" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phoneNumber">
          <Input placeholder="Số điện thoại" />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input placeholder="Địa chỉ" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Giới tính" name="gender">
              <Select>
                <Select.Option value="Male">Nam</Select.Option>
                <Select.Option value="Female">Nữ</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Ngày sinh" name="dateOfBirth">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        <StyledButton type="primary" onClick={handleUpdate}>
          CẬP NHẬT
        </StyledButton>
      </Form>
    </Container>
  );
};

export default AccountInfoComponent;
