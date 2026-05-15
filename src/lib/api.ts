import axios from 'axios';

/** Use Node API (Vercel /api or local :3001). Set VITE_USE_NODE_API=true */
const useNodeApi =
  import.meta.env.VITE_USE_NODE_API === 'true' ||
  import.meta.env.VITE_USE_NODE_API === '1';

/**
 * PHP (InfinityFree): VITE_API_URL=https://agrihubug.infinityfreeapp.com
 * Node on Vercel (same origin): VITE_USE_NODE_API=true, leave VITE_API_URL empty
 * Node local dev: VITE_USE_NODE_API=true (Vite proxies to :3001)
 */
export const API_BASE = useNodeApi
  ? (import.meta.env.VITE_API_URL ?? '')
  : (import.meta.env.VITE_API_URL ?? 'http://localhost/agrihub');

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrihub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
