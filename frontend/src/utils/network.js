import axios from "axios"

export const BASE_URL = import.meta.env.VITE_API_URL;


export const api = axios.create({
  
  baseURL: BASE_URL || "http://localhost:8001",
  withCredentials: true,
  
  headers: {
    "Content-Type": "application/json",
  },
})

export const formApi = axios.create({
  
  baseURL: BASE_URL || "http://localhost:8001",
  withCredentials: true,
  
  headers: {
    "Content-Type": "multipart/form-data",
  },
})

// console.log("API baseURL =", api.defaults.baseURL);