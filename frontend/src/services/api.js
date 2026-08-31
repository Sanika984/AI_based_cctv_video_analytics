import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Update this if backend runs on a different port/host
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If not already on login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginUser = async ({ username, password }) => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const createUser = async (userData) => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const updateUser = async (userId, userData) => {
  const { data } = await api.put(`/users/${userId}`, userData);
  return data;
};

export const deleteUser = async (userId) => {
  const { data } = await api.delete(`/users/${userId}`);
  return data;
};

// Analytics Endpoints
export const getFootfall = async () => {
  const { data } = await api.get('/analytics/footfall');
  return data;
};

export const getHeatmap = async () => {
  const { data } = await api.get('/analytics/heatmap');
  return data;
};

export const getInOutSummary = async () => {
  const { data } = await api.get('/analytics/in-out/summary');
  return data;
};

export const getFloorWiseStats = async () => {
  const { data } = await api.get('/analytics/in-out/floor-wise');
  return data;
};

export const getHourlyStats = async () => {
  const { data } = await api.get('/analytics/in-out/hourly-stats');
  return data;
};
// Camera Endpoints
export const getCameras = async () => {
  try {
    const { data } = await api.get('/cameras');
    return data;
  } catch (error) {
    console.warn('Backend unavailable. Using mock camera data.');
    return [
      {
        camera_id: 'CAM001',
        name: 'Main Entrance Camera',
        zone: 'Entrance',
        status: 'Online',
      },
      {
        camera_id: 'CAM002',
        name: 'Parking Camera',
        zone: 'Parking',
        status: 'Offline',
      },
      {
        camera_id: 'CAM003',
        name: 'Lobby Camera',
        zone: 'Lobby',
        status: 'Online',
      },
      {
        camera_id: 'CAM004',
        name: 'Checkout Camera',
        zone: 'Checkout',
        status: 'Online',
      },
      {
        camera_id: 'CAM005',
        name: 'Loading Dock Camera',
        zone: 'Loading Dock',
        status: 'Offline',
      },
    ];
  }
};

export const getCameraById = async (id) => {
  const { data } = await api.get(`/cameras/${id}`);
  return data;
};

export const addCamera = async (cameraData) => {
  const { data } = await api.post('/cameras', cameraData);
  return data;
};

export const updateCamera = async ({ id, cameraData }) => {
  const { data } = await api.put(`/cameras/${id}`, cameraData);
  return data;
};

export const deleteCamera = async (id) => {
  const { data } = await api.delete(`/cameras/${id}`);
  return data;
};

// Stream & Snapshot Endpoints
export const getCameraSnapshot = async (sourceUrl) => {
  const { data } = await api.post('/stream/snapshot', { sourceUrl }, { responseType: 'blob' });
  return data;
};

export const verifyStreamSource = async (sourceUrl) => {
  const { data } = await api.post('/stream/test', { sourceUrl });
  return data;
};

export const getPreviewStreamUrl = (sourceUrl) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:8000';
  return `${baseURL}/stream/preview?source=${encodeURIComponent(sourceUrl)}`;
};

export const stopStream = async (payload = null) => {
  try {
    const body = typeof payload === 'string' ? { key: payload } : (payload || {});
    const { data } = await api.post('/stream/stop', body);
    return data;
  } catch (err) {
    return null;
  }
};

export const getStreamStats = async () => {
  try {
    const { data } = await api.get('/stream/stats');
    return data;
  } catch (err) {
    return null;
  }
};

// Security Alerts & Live Detection Endpoints
export const getAlerts = async (params = {}) => {
  const { data } = await api.get('/analytics/alerts', { params });
  return data;
};

export const acknowledgeAlert = async (alertId, username = 'Operator') => {
  const { data } = await api.post(`/analytics/alerts/${alertId}/acknowledge`, { username });
  return data;
};

export const getSecurityStatus = async () => {
  try {
    const { data } = await api.get('/analytics/security/status');
    return data;
  } catch (err) {
    return {};
  }
};

// License Plate & Vehicle Analytics Endpoints
export const getVehicleLogs = async (params = {}) => {
  const { data } = await api.get('/analytics/vehicles/logs', { params });
  return data;
};

export const getVehicleStats = async () => {
  const { data } = await api.get('/analytics/vehicles/stats');
  return data;
};

export const getLicensePlateStatus = async () => {
  try {
    const { data } = await api.get('/analytics/license-plate/status');
    return data;
  } catch (err) {
    return {};
  }
};

export const getBlacklistedVehicles = async () => {
  const { data } = await api.get('/blacklisted-vehicles');
  return data;
};

export const createBlacklistedVehicle = async (payload) => {
  const { data } = await api.post('/blacklisted-vehicles', payload);
  return data;
};

export const deleteBlacklistedVehicle = async (vehicleId) => {
  const { data } = await api.delete(`/blacklisted-vehicles/${vehicleId}`);
  return data;
};

export default api;

