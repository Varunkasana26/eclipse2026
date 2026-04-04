const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

function parseResponseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    return text;
  }
}

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
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data !== null
        ? data.error || data.message || `${response.status} ${response.statusText}`
        : data || `${response.status} ${response.statusText}`
    );
  }

  return data;
}

async function requestBinary(path, { body, headers = {}, method = 'POST' } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data !== null
        ? data.error || data.message || `${response.status} ${response.statusText}`
        : data || `${response.status} ${response.statusText}`
    );
  }

  return data;
}

async function fetchNodes() {
  return request('/api/nodes');
}

async function fetchWorkspaces() {
  return request('/api/workspaces');
}

async function fetchOnboardingNodes() {
  return request('/api/onboarding');
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

async function createOnboardingNode(payload) {
  return request('/api/onboarding/nodes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function uploadJobAsset(jobId, file, options = {}) {
  const complete = Boolean(options.complete);
  return requestBinary(`/api/jobs/${encodeURIComponent(jobId)}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file?.name || 'asset.bin'),
      'X-Content-Type': file?.type || 'application/octet-stream',
      ...(complete ? { 'X-Upload-Complete': 'true' } : {}),
    },
    body: file,
  });
}

export {
  API_BASE,
  createOnboardingNode,
  fetchJob,
  fetchJobs,
  fetchNodes,
  fetchOnboardingNodes,
  fetchWorkspaces,
  submitJob,
  uploadJobAsset,
};
