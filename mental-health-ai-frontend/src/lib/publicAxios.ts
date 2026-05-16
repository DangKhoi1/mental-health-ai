import axios from 'axios';

const publicAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicAxios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return error?.response?.data ?? Promise.reject(error);
  }
);

export default publicAxios;
