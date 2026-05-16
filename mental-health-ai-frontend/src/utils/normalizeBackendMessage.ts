export function normalizeBackendMessage(
  message?: string | null,
  fallback: string = 'Có lỗi xảy ra. Vui lòng thử lại.',
): string {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) {
    return fallback;
  }

  switch (trimmedMessage) {
    case "You don't have permission to access this resource":
      return 'Bạn không có quyền truy cập tài nguyên này.';
    case 'Token is not valid or not bear token in header request':
      return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
    case 'Invalid credentials':
      return 'Tên đăng nhập hoặc mật khẩu không đúng.';
    case 'Account is deactivated':
      return 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên.';
    case 'Account has been deleted':
      return 'Tài khoản của bạn đã bị xóa.';
    case 'Sleep log not found':
      return 'Không tìm thấy bản ghi giấc ngủ.';
    case 'Daily mood not found':
      return 'Không tìm thấy bản ghi tâm trạng.';
    case 'Journal not found':
      return 'Không tìm thấy bài nhật ký.';
    case 'User not found':
      return 'Không tìm thấy người dùng.';
    case 'Username already exists':
      return 'Tên đăng nhập đã tồn tại.';
    case 'Email already exists':
      return 'Email đã được sử dụng.';
    case 'Email is required':
      return 'Vui lòng nhập email để đăng ký.';
    case 'Registration successful':
      return 'Đăng ký thành công.';
    default:
      return trimmedMessage;
  }
}