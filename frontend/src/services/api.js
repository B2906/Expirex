import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8011',
  headers: {
    Accept: 'application/json',
  },
})

const get = (path) => api.get(path).then(({ data }) => data)

export const getHealth = () => get('/health')
export const getDashboard = () => get('/dashboard')
export const getShipments = () => get('/shipments')
export const getShipment = (id) => get(`/shipments/${encodeURIComponent(id)}`)
export const getMisplaced = () => get('/misplaced')
export const getHubs = () => get('/hubs')
export const getRoutes = () => get('/routes')
export const getRecovery = () => get('/recovery')
export const getRecoveryForShipment = (id) => get(`/recovery/${encodeURIComponent(id)}`)
export const getMonteCarlo = () => get('/monte-carlo')
export const getExplanation = (id) => get(`/explanation/${encodeURIComponent(id)}`)

export default api
