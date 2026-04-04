const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `${response.status} ${response.statusText}`);
  }

  return data;
}

async function fetchNodes() {
  return request('/api/nodes');
}

async function fetchJobs() {
  return request('/api/jobs');
}

async function fetchJob(jobId) {
  return request(`/api/jobs/${jobId}`);
}

async function submitJob(payload) {
  return request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { API_BASE, fetchJob, fetchJobs, fetchNodes, submitJob };
