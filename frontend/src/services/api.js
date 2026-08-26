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

//export const getCameras = async () => {
  //const { data } = await api.get('/cameras');
  //return data;
//};
//new added code for mock data
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
//till here

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

export const getCameraById = async (id) => {
  const { data } = await api.get(`/cameras/${id}`);
  return data;
};

export const getCameraSnapshot = async (sourceUrl) => {
  const { data } = await api.post('/stream/snapshot', { sourceUrl }, { responseType: 'blob' });
  return data;
};

export default api;
