export interface IBackendRes<T = unknown> {
  statusCode: number;
  EC: number;
  EM: string;
  message?: string;
  data?: T;
}

export interface IPaginatedRes<T> {
  EC: number;
  EM: string;
  data: {
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    result: T[];
  };
}

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
