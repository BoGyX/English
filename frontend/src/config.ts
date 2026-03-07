// Централизованная конфигурация приложения
// Все значения берутся из переменных окружения

// Для production (Docker) используем runtime config из window.ENV
// Для development используем import.meta.env
declare global {
  interface Window {
    ENV?: {
      VITE_API_URL?: string
    }
  }
}

const API_URL = window.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:9090/api'

export const config = {
  // API URLs
  apiUrl: API_URL,
  baseUrl: API_URL.replace('/api', ''), // Базовый URL без /api
  
  // Вспомогательные функции
  getFullUrl: (path: string) => {
    if (!path) return ''
    // Если URL уже полный (начинается с http), возвращаем как есть
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    // Если относительный путь, добавляем базовый URL
    if (path.startsWith('/')) {
      return `${API_URL.replace('/api', '')}${path}`
    }
    return path
  }
}

export default config
