import axios from "axios";

// Production backend domain
const BASE_URL = "https://uia037.dev.openconsultinguk.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
