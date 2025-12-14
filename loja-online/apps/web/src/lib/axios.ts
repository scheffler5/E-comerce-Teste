import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Antes de enviar, coloca o Token
api.interceptors.request.use(
  (config) => {
    // Apenas no lado do cliente (browser) tentamos pegar o token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('loja-token'); // Vamos padronizar esse nome
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Se der erro 401 (Não autorizado), desloga o cara
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Opcional: Redirecionar para login ou limpar storage
        // localStorage.removeItem('loja-token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;