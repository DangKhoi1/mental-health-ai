export interface ApiResponse<T = unknown> {
  statusCode: number;
  EC: number;
  EM: string;
  data: T;
}
