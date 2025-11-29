// src/config.js

// In development (npm run dev), this uses localhost.
// In production (Vercel/Netlify), set the VITE_API_URL environment variable.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default API_BASE_URL;
