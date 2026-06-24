import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api';

const client = {
    // Dashboard Core
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
    getAiStatus: () => axios.get(`${API_BASE}/grants/ai-status`).then(r => r.data),

    // Review (Tier 2: Monthly Review Summary, Tier 3: Recommended Actions)
    getReviewSummary: (filters) => axios.get(`${API_BASE}/review/summary`, { params: filters }).then(r => r.data),
    generateReviewNarrative: (insight) => axios.post(`${API_BASE}/review/summary/narrative`, { insight }).then(r => r.data),
    // client.js
getRecommendedActions: (filters) => {
    // Ensure the month is actually present before calling
    if (!filters.month) return Promise.resolve({ success: false, data: [] });
    
    return axios.get(`${API_BASE}/review/actions`, { 
        params: { month: filters.month, district: filters.district, block: filters.block } 
    }).then(r => r.data);
},

    // Geography (Tier 2: Program Reporting Assistant)
    getGeographySummary: (type, name, month) => axios.get(`${API_BASE}/geography/${type}/${encodeURIComponent(name)}/summary`, { params: { month } }).then(r => r.data),
    generateGeographyNarrative: (insight) => axios.post(`${API_BASE}/geography/narrative`, { insight }).then(r => r.data)
};

export default client;
export { API_BASE };