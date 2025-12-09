import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes for build operations
});

// Projects API
export const getProjects = () => api.get('/projects');
export const createProject = (projectData) => api.post('/projects', projectData);
export const cloneProject = (cloneData) => api.post('/projects/clone', cloneData);
export const updateProject = (id, projectData) => api.put(`/projects/${id}`, projectData);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// PM2 Sync API
export const syncPM2 = () => api.get('/pm2/sync');
export const autoMapPM2 = () => api.post('/pm2/auto-map');

// PM2 API
export const getPM2Status = () => api.get('/pm2/status');
export const getPM2ProcessStatus = (processName) => api.get(`/pm2/status/${processName}`);
export const restartProcess = (processName) => api.post(`/pm2/restart/${processName}`);
export const stopProcess = (processName) => api.post(`/pm2/stop/${processName}`);
export const startProcess = (processName) => api.post(`/pm2/start/${processName}`);

// Logs API
export const getProcessLogs = (processName, lines = 100) => 
  api.get(`/logs/${processName}`, { params: { lines } });

// Build & Deploy API
export const buildProject = (projectName) => api.post(`/build/${projectName}`);
export const deployProject = (projectName) => api.post(`/deploy/${projectName}`);
export const runDeployScript = (projectName) => api.post(`/deploy-script/${projectName}`);

// System API
export const getMongoDBStatus = () => api.get('/system/mongodb');

export default api;
