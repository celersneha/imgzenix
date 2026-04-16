import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import { HttpError } from "./api-client";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Token is managed via cookies (httpOnly), so no need to manually attach
    // But you can add custom headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Extract error message from response
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "Request failed";
    return Promise.reject(
      new HttpError(message, error.response?.status || 500),
    );
  },
);

export default axiosInstance;
