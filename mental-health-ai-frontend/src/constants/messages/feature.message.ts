export const DailyMoodMessages = {
  createSuccess: 'Đã ghi nhận tâm trạng hôm nay',
  createError: 'Không thể ghi nhận tâm trạng. Vui lòng thử lại.',
  updateSuccess: 'Đã cập nhật tâm trạng',
  updateError: 'Không thể cập nhật tâm trạng',
  deleteSuccess: 'Đã xóa ghi nhận tâm trạng',
  deleteError: 'Không thể xóa ghi nhận tâm trạng',
  fetchError: 'Không thể tải dữ liệu tâm trạng',
} as const;

export const JournalMessages = {
  createSuccess: 'Đã lưu nhật ký',
  createError: 'Không thể lưu nhật ký. Vui lòng thử lại.',
  updateSuccess: 'Đã cập nhật nhật ký',
  updateError: 'Không thể cập nhật nhật ký',
  deleteSuccess: 'Đã xóa nhật ký',
  deleteError: 'Không thể xóa nhật ký',
  fetchError: 'Không thể tải nhật ký',
} as const;

export const SleepLogMessages = {
  createSuccess: 'Đã ghi nhận giấc ngủ',
  createError: 'Không thể ghi nhận giấc ngủ. Vui lòng thử lại.',
  updateSuccess: 'Đã cập nhật ghi nhận giấc ngủ',
  updateError: 'Không thể cập nhật ghi nhận giấc ngủ',
  deleteSuccess: 'Đã xóa ghi nhận giấc ngủ',
  deleteError: 'Không thể xóa ghi nhận giấc ngủ',
  fetchError: 'Không thể tải dữ liệu giấc ngủ',
} as const;

export const AssessmentMessages = {
  startSuccess: 'Đã bắt đầu bài đánh giá',
  startError: 'Không thể bắt đầu bài đánh giá',
  submitSuccess: 'Đã hoàn thành bài đánh giá',
  submitError: 'Không thể gửi bài đánh giá. Vui lòng thử lại.',
  fetchError: 'Không thể tải bài đánh giá',
} as const;
