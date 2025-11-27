import React, { useState } from "react";
import styled from "styled-components";
import { Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/Slicer/authSlice";
import { forgotPassword, resetPassword } from "../../redux/Slicer/userSlice";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

// Styled Components
const Wrapper = styled.div`
  max-width: 300px;
  margin: 50px auto;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;
const Title = styled.h2`
  color: #1da0f1;
  font-size: 24px;
  font-weight: bold;
`;
const Divider = styled.div`
  width: 50%;
  height: 4px;
  background-color: #1da0f1;
  margin: 8px auto 20px;
  border-radius: 2px;
`;
const StyledInput = styled(Input)`
  margin-bottom: 16px;
  border-radius: 4px;
  padding: 8px;
`;
const StyledButton = styled(Button)`
  background-color: #1da0f1;
  border-color: #1da0f1;
  color: white;
  font-weight: bold;
  width: 100%;
  height: 40px;

  &:hover {
    background-color: white;
    border-color: #1da0f1;
  }
`;
const LinksWrapper = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
`;
const Link = styled.a`
  color: #1da0f1;
  font-size: 14px;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const validatePassword = (password) => {
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (password.length > 128) return "Mật khẩu quá dài.";
  if (!/[!@#$%^~&*(),.?":{}|<>/+=_\-\\|;'\[\]<>`]/.test(password))
    return "Mật khẩu phải chứa ký tự đặc biệt.";
  if (!/[A-Z]/.test(password)) return "Phải có chữ in hoa.";
  if (!/[a-z]/.test(password)) return "Phải có chữ thường.";
  if (!/[0-9]/.test(password)) return "Phải có số.";
  return "";
};

const LoginPageComponent = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStep, setCurrentStep] = useState("login");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const { resetPasswordStatus, forgotPasswordStatus, forgotPasswordError } =
    useSelector((state) => state.user);

  // ============================================================
  // 🔥 LOGIN — ĐÃ CHỈNH ĐỂ LƯU avatarUrl VÀO localStorage
  // ============================================================
  const handleLogin = () => {
    if (!account) return message.warning("Vui lòng nhập email!");
    if (!password) return message.warning("Vui lòng nhập mật khẩu!");

    dispatch(loginUser({ username: account, password }))
      .unwrap()
      .then((response) => {
        if (!response || response === "error") {
          return message.error(
            "Email hoặc mật khẩu không đúng hoặc tài khoản bị khóa!"
          );
        }

        // Save token
        localStorage.setItem("token", response.token);

        // Decode token for userId
        const decodedToken = jwtDecode(response.token);

        // 🔥 NEW: Lưu avatarUrl nếu backend trả về
        if (response.avatarUrl) {
          localStorage.setItem("avatarUrl", response.avatarUrl);
        }

        // Redirect user
        navigate(localStorage.getItem("previousURL") || "/");

        setTimeout(() => window.location.reload(), 1000);
        message.success("Đăng nhập thành công!");

        axios
          .get(`http://localhost:8081/api/cart/${decodedToken?.userId}`, {
            headers: {
              Authorization: `Bearer ${response.token}`,
            },
          })
          .then((response) => {
            localStorage.setItem("cart", JSON.stringify(response.data));
          })
          .catch((error) => {
            console.error("Error fetching cart:", error);
          });
      })
      .catch(() => {
        message.error("Đăng nhập thất bại");
      });
  };

  // =================================================================
  // FORGOT PASSWORD + RESET PASSWORD (KEEP NGUYÊN KHÔNG CHỈNH)
  // =================================================================

  const handleForgotPasswordStep1 = () => {
    if (!email) {
      setErrorMessage("Vui lòng nhập email!");
      return;
    }

    dispatch(forgotPassword(email))
      .unwrap()
      .then((response) => {
        if (response?.er) {
          setErrorMessage(
            "Email người dùng không đúng hoặc tài khoản bị khóa!"
          );
        } else {
          message.success("Email xác nhận đã được gửi!");
          setCurrentStep("step2");
        }
      })
      .catch(() => {});
  };

  const handleForgotPasswordStep2 = () => {
    const passErr = validatePassword(newPassword);
    if (passErr) {
      setErrorMessage(passErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu không khớp!");
      return;
    }

    if (!code) {
      setErrorMessage("Mã xác nhận không được để trống");
      return;
    }

    dispatch(resetPassword({ email, resetCode: code, newPassword }))
      .unwrap()
      .then(() => {
        message.success("Đổi mật khẩu thành công!");
        setCurrentStep("login");
      })
      .catch(() => {
        setErrorMessage("Mã xác nhận không chính xác");
      });
  };

  // =================================================================
  // UI RENDER
  // =================================================================

  const renderContent = () => {
    switch (currentStep) {
      case "step1":
        return (
          <div>
            <Title>Nhập Email</Title>
            <Divider />
            <StyledInput
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errorMessage && (
              <div style={{ color: "red" }}>{errorMessage}</div>
            )}
            <StyledButton
              onClick={handleForgotPasswordStep1}
              loading={forgotPasswordStatus === "loading"}
            >
              Gửi mã xác nhận
            </StyledButton>
            {forgotPasswordError && (
              <p style={{ color: "red", marginTop: "10px" }}>
                {forgotPasswordError?.message || forgotPasswordError}
              </p>
            )}
          </div>
        );

      case "step2":
        return (
          <div>
            <Title>Nhập Mã Xác Nhận và Đổi Mật Khẩu</Title>
            <Divider />
            <StyledInput
              placeholder="Nhập mã xác nhận"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <StyledInput.Password
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <StyledInput.Password
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errorMessage && (
              <div style={{ color: "red" }}>{errorMessage}</div>
            )}
            <StyledButton
              onClick={handleForgotPasswordStep2}
              loading={resetPasswordStatus === "loading"}
            >
              Đổi mật khẩu
            </StyledButton>
          </div>
        );

      default:
        return (
          <div>
            <Title>ĐĂNG NHẬP</Title>
            <Divider />
            <StyledInput
              placeholder="Email"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            <StyledInput
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMessage && (
              <div style={{ color: "red" }}>{errorMessage}</div>
            )}
            <StyledButton onClick={handleLogin} loading={status === "loading"}>
              ĐĂNG NHẬP
            </StyledButton>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <LinksWrapper>
              <Link onClick={() => setCurrentStep("step1")}>
                Quên mật khẩu
              </Link>
              <Link href="/signup">Đăng ký tại đây</Link>
            </LinksWrapper>
          </div>
        );
    }
  };

  return <Wrapper>{renderContent()}</Wrapper>;
};

export default LoginPageComponent;
