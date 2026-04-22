import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Update this if backend runs on a different port/host
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFootfall = async () => {
  const { data } = await api.get('/analytics/footfall');
  return data;
};

export const getHeatmap = async () => {
  const { data } = await api.get('/analytics/heatmap');
  return data;
};

export const getCameras = async () => {
  const { data } = await api.get('/cameras');
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get('/users');
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

export default api;
