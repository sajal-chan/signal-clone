import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } else {
      const raw = err.response?.data?.detail;
      const message = Array.isArray(raw)
        ? (raw as Array<{ msg: string }>).map((e) => e.msg).join(", ")
        : (raw as string | undefined) ?? "Something went wrong";
      useToastStore.getState().addToast(message, "error");
    }
    return Promise.reject(err);
  }
);

export default api;
