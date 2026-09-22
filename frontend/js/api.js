// frontend/js/api.js
// CareerForge AI — Centralized API Client

const API_CONFIG = {
  BASE_URL: (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://127.0.0.1:8000',
  TIMEOUT_MS: 30000,
};

class ApiClient {
  constructor(config = API_CONFIG) {
    this.baseUrl = config.BASE_URL.replace(/\/$/, '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = options.headers ? { ...options.headers } : {};

    // Do NOT set Content-Type header if sending FormData (let the browser calculate multipart boundary)
    if (!(options.body instanceof FormData)) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const fetchOptions = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, fetchOptions);
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorDetail = (data && typeof data === 'object' && data.detail) 
          ? data.detail 
          : (typeof data === 'string' && data ? data : `Request failed with status ${response.status}`);
        throw new Error(errorDetail);
      }

      return data;
    } catch (err) {
      console.error(`[API Client Error] ${options.method || 'GET'} ${url}:`, err);
      throw err;
    }
  }

  getHealth() {
    return this.request('/health');
  }

  analyzeCandidate(resumeFile, jobDescriptionTextOrFile) {
    const formData = new FormData();
    formData.append('resume', resumeFile);

    if (jobDescriptionTextOrFile instanceof File) {
      formData.append('job_description', jobDescriptionTextOrFile);
    } else if (typeof jobDescriptionTextOrFile === 'string') {
      formData.append('job_description_text', jobDescriptionTextOrFile);
    }

    return this.request('/api/analyze', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
if (typeof window !== 'undefined') {
  window.CareerForgeApi = api;
}
