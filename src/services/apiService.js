const API_BASE = '/api';

export const apiService = {
  async fetchData() {
    const response = await fetch(`${API_BASE}/data`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  },

  async saveData(data) {
    const response = await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }
    return response.json();
  }
};
