import { apiClient } from './client.js';

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
};

export const usersApi = {
  list: () => apiClient.get('/users').then((r) => r.data),
  create: (data) => apiClient.post('/users', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id) => apiClient.delete(`/users/${id}`).then((r) => r.data),
};

export const leadsApi = {
  list: (params) => apiClient.get('/leads', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/leads/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/leads', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/leads/${id}`, data).then((r) => r.data),
  moveStage: (id, stage) => apiClient.patch(`/leads/${id}/stage`, { stage }).then((r) => r.data),
  assign: (id, owner) => apiClient.patch(`/leads/${id}/assign`, { owner }).then((r) => r.data),
  archive: (id) => apiClient.delete(`/leads/${id}`).then((r) => r.data),
  bulkImport: (formData) =>
    apiClient
      .post('/leads/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  activities: (leadId) => apiClient.get(`/leads/${leadId}/activities`).then((r) => r.data),
  addActivity: (leadId, data) =>
    apiClient.post(`/leads/${leadId}/activities`, data).then((r) => r.data),
};

export const tasksApi = {
  myDay: () => apiClient.get('/tasks/my-day').then((r) => r.data),
  list: (params) => apiClient.get('/tasks', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/tasks', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/tasks/${id}`, data).then((r) => r.data),
  complete: (id) => apiClient.post(`/tasks/${id}/complete`).then((r) => r.data),
  snooze: (id, until) => apiClient.post(`/tasks/${id}/snooze`, { until }).then((r) => r.data),
};

export const quotesApi = {
  list: (params) => apiClient.get('/quotes', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/quotes/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/quotes', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/quotes/${id}`, data).then((r) => r.data),
  send: (id) => apiClient.post(`/quotes/${id}/send`).then((r) => r.data),
  pdfUrl: (id) => {
    const base = apiClient.defaults.baseURL;
    const tok = localStorage.getItem('ff_token');
    return `${base}/quotes/${id}/pdf?token=${tok}`;
  },
};

export const samplesApi = {
  list: (params) => apiClient.get('/samples', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/samples', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/samples/${id}`, data).then((r) => r.data),
};

export const notificationsApi = {
  list: () => apiClient.get('/notifications').then((r) => r.data),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),
};

export const analyticsApi = {
  kpis: () => apiClient.get('/analytics/kpis').then((r) => r.data),
  funnel: () => apiClient.get('/analytics/funnel').then((r) => r.data),
  leaderboard: (params) => apiClient.get('/analytics/leaderboard', { params }).then((r) => r.data),
  forecast: () => apiClient.get('/analytics/forecast').then((r) => r.data),
  stuckDeals: (params) => apiClient.get('/analytics/stuck-deals', { params }).then((r) => r.data),
  scorecard: (userId) => apiClient.get(`/analytics/scorecard/${userId}`).then((r) => r.data),
  heatmap: (userId) => apiClient.get(`/analytics/heatmap/${userId}`).then((r) => r.data),
  activityFeed: () => apiClient.get('/analytics/activity-feed').then((r) => r.data),
};

export const settingsApi = {
  products: {
    list: () => apiClient.get('/settings/products').then((r) => r.data),
    create: (data) => apiClient.post('/settings/products', data).then((r) => r.data),
    update: (id, data) => apiClient.patch(`/settings/products/${id}`, data).then((r) => r.data),
    delete: (id) => apiClient.delete(`/settings/products/${id}`).then((r) => r.data),
  },
  stages: {
    list: () => apiClient.get('/settings/stages').then((r) => r.data),
    create: (data) => apiClient.post('/settings/stages', data).then((r) => r.data),
    update: (id, data) => apiClient.patch(`/settings/stages/${id}`, data).then((r) => r.data),
    reorder: (order) => apiClient.patch('/settings/stages/reorder', { order }).then((r) => r.data),
    delete: (id) => apiClient.delete(`/settings/stages/${id}`).then((r) => r.data),
  },
  sources: {
    list: () => apiClient.get('/settings/sources').then((r) => r.data),
    create: (data) => apiClient.post('/settings/sources', data).then((r) => r.data),
    update: (id, data) => apiClient.patch(`/settings/sources/${id}`, data).then((r) => r.data),
    delete: (id) => apiClient.delete(`/settings/sources/${id}`).then((r) => r.data),
  },
};
