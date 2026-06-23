import axios from 'axios';

// Relative paths — Vite dev server proxies /api and /images to the backend
// (see vite.config.js). In production, serve the built client behind the
// same origin as the API, or set VITE_API_BASE at build time.
const API_BASE = '/api';

const client = {
    // Dashboard
    getFilters: () => axios.get(`${API_BASE}/dashboard/filters`).then(r => r.data),
    getSummary: (filters) => axios.get(`${API_BASE}/dashboard/summary`, { params: filters }).then(r => r.data),
    getDistrictBreakdown: (filters) => axios.get(`${API_BASE}/dashboard/breakdown/district`, { params: filters }).then(r => r.data),
    getBlockBreakdown: (filters) => axios.get(`${API_BASE}/dashboard/breakdown/block`, { params: filters }).then(r => r.data),
    getSubjectBreakdown: (filters) => axios.get(`${API_BASE}/dashboard/breakdown/subject`, { params: filters }).then(r => r.data),
    getPriorities: (filters) => axios.get(`${API_BASE}/dashboard/priorities`, { params: filters }).then(r => r.data),

    // Grants
    getGrantList: () => axios.get(`${API_BASE}/grants/list`).then(r => r.data),
    getGrantDetails: (grantId, month) => axios.get(`${API_BASE}/grants/details/${grantId}`, { params: { month } }).then(r => r.data),
    generateNarrative: (performance, finances) => axios.post(`${API_BASE}/grants/narrative`, { performance, finances }).then(r => r.data),
    getAiStatus: () => axios.get(`${API_BASE}/grants/ai-status`).then(r => r.data)
};

export default client;
export { API_BASE };