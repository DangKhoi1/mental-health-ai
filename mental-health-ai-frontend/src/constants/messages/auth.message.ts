export const AuthMessages = {
  loginSuccess: 'Đăng nhập thành công',
  loginError: 'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.',
  loginErrorGeneric: 'Có lỗi xảy ra khi đăng nhập',
  
  registerSuccess: 'Đăng ký thành công. Vui lòng đăng nhập.',
  registerError: 'Đăng ký thất bại',
  registerErrorGeneric: 'Có lỗi xảy ra khi đăng ký',
  
  logoutSuccess: 'Đăng xuất thành công',
  logoutError: 'Có lỗi xảy ra khi đăng xuất',
  
  tokenExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  tokenRefreshError: 'Không thể làm mới phiên đăng nhập',
  
  usernameRequired: 'Tên đăng nhập là bắt buộc',
  usernameMinLength: 'Tên đăng nhập phải có ít nhất 3 ký tự',
  usernameInvalid: 'Tên đăng nhập không hợp lệ',
  emailRequired: 'Email là bắt buộc',
  emailInvalid: 'Email không hợp lệ',
  passwordRequired: 'Mật khẩu là bắt buộc',
  passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
  fullNameRequired: 'Họ tên là bắt buộc',
  fullNameMinLength: 'Họ tên phải có ít nhất 3 ký tự',
} as const;

export const UserMessages = {
  profileUpdateSuccess: 'Cập nhật thông tin thành công',
  profileUpdateError: 'Cập nhật thông tin thất bại',
  passwordChangeSuccess: 'Đổi mật khẩu thành công',
  passwordChangeError: 'Đổi mật khẩu thất bại',
  avatarUploadSuccess: 'Cập nhật ảnh đại diện thành công',
  avatarUploadError: 'Cập nhật ảnh đại diện thất bại',
} as const;
