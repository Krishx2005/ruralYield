import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createBond(data) {
  const response = await api.post('/bonds', data);
  return response.data;
}

export async function getBonds(params = {}) {
  const response = await api.get('/bonds', { params });
  return response.data;
}

export async function getBond(id) {
  const response = await api.get(`/bonds/${id}`);
  return response.data;
}

export async function investInBond(id, investorData) {
  const response = await api.put(`/bonds/${id}/invest`, investorData);
  return response.data;
}

export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  const response = await api.post('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function synthesizeSpeech(text) {
  const response = await api.post(
    '/voice/synthesize',
    { text },
    { responseType: 'blob' }
  );
  return response.data;
}

export async function checkCompliance(text) {
  const response = await api.post('/compliance/check', { text });
  return response.data;
}

export async function scoreRisk(data) {
  const response = await api.post('/risk/score', data);
  return response.data;
}

export async function getBondFunding(id) {
  const response = await api.get(`/bonds/${id}/funding`);
  return response.data;
}

export async function createInvestor(data) {
  const response = await api.post('/investors', data);
  return response.data;
}

export async function getInvestor(id) {
  const response = await api.get(`/investors/${id}`);
  return response.data;
}

export async function getPortfolio(id) {
  const response = await api.get(`/investors/${id}/portfolio`);
  return response.data;
}

export async function getAnalytics() {
  const response = await api.get('/analytics');
  return response.data;
}

export async function getActivity(limit = 20) {
  const response = await api.get('/activity', { params: { limit } });
  return response.data;
}

export async function uploadBondVideo(videoBlob) {
  const formData = new FormData();
  formData.append('file', videoBlob, 'pitch.webm');
  const response = await api.post('/bonds/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getRepaymentSchedule(bondId, data = {}) {
  const response = await api.post(`/bonds/${bondId}/repayment-schedule`, data);
  return response.data;
}

export async function addToWatchlist(investorId, bondId) {
  const response = await api.post(`/investors/${investorId}/watchlist`, { bond_id: bondId });
  return response.data;
}

export async function removeFromWatchlist(investorId, bondId) {
  const response = await api.delete(`/investors/${investorId}/watchlist/${bondId}`);
  return response.data;
}

export async function getWatchlist(investorId) {
  const response = await api.get(`/investors/${investorId}/watchlist`);
  return response.data;
}

export async function getCountyAnalytics(county) {
  const response = await api.get(`/analytics/county/${encodeURIComponent(county)}`);
  return response.data;
}

export async function getCreditScore(farmerId) {
  const response = await api.post(`/farmers/${farmerId}/credit-score`);
  return response.data;
}

export async function getFarmerProfile(farmerId) {
  const response = await api.get(`/farmers/${farmerId}/profile`);
  return response.data;
}

export async function getImpact() {
  const response = await api.get('/impact');
  return response.data;
}

export async function suggestPricing(data) {
  const response = await api.post('/bonds/suggest-pricing', data);
  return response.data;
}

export async function getMarketListings() {
  const response = await api.get('/market');
  return response.data;
}

export async function createListing(data) {
  const response = await api.post('/market/list', data);
  return response.data;
}

export async function buyListing(data) {
  const response = await api.post('/market/buy', data);
  return response.data;
}

export async function cancelListing(listingId) {
  const response = await api.delete(`/market/${listingId}`);
  return response.data;
}

export async function chatWithAssistant(messages) {
  const response = await api.post('/assistant/chat', { messages });
  return response.data;
}

export async function getBondMessages(bondId) {
  const response = await api.get(`/bonds/${bondId}/messages`);
  return response.data;
}

export async function postBondMessage(bondId, data) {
  const response = await api.post(`/bonds/${bondId}/messages`, data);
  return response.data;
}

export default api;
