// API Base URL
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

// Helper para hacer requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}

// ============================================
// FORUM API
// ============================================
export const forumApi = {
  getCategories: () => apiRequest('/api/forum/categories'),

  getTopicsByCategory: (categoryId: number, page = 1, limit = 20) =>
    apiRequest(`/api/forum/categories/${categoryId}/topics?page=${page}&limit=${limit}`),

  getTopic: (topicId: number) =>
    apiRequest(`/api/forum/topics/${topicId}`),

  createTopic: (data: { categoryId: number; title: string; content: string }) =>
    apiRequest('/api/forum/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  voteTopic: (topicId: number, vote: 1 | -1) =>
    apiRequest(`/api/forum/topics/${topicId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    }),

  addComment: (topicId: number, content: string) =>
    apiRequest(`/api/forum/topics/${topicId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteTopic: (topicId: number) =>
    apiRequest(`/api/forum/topics/${topicId}`, { method: 'DELETE' }),

  toggleLockTopic: (topicId: number) =>
    apiRequest(`/api/forum/topics/${topicId}/lock`, { method: 'PATCH' }),

  togglePinTopic: (topicId: number) =>
    apiRequest(`/api/forum/topics/${topicId}/pin`, { method: 'PATCH' }),

  deleteComment: (commentId: number) =>
    apiRequest(`/api/forum/comments/${commentId}`, { method: 'DELETE' }),
};

// ============================================
// NEWS API
// ============================================
export const newsApi = {
  getNews: (page = 1, limit = 10, categoryId?: number) =>
    apiRequest(`/api/news?page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ''}`),

  getNewsById: (newsId: number) =>
    apiRequest(`/api/news/${newsId}`),

  likeNews: (newsId: number) =>
    apiRequest(`/api/news/${newsId}/like`, { method: 'POST' }),

  getCategories: () =>
    apiRequest('/api/news/categories'),

  // Admin
  getAllNewsAdmin: (page = 1, limit = 20) =>
    apiRequest(`/api/news/admin/all?page=${page}&limit=${limit}`),

  createNews: (data: any) =>
    apiRequest('/api/news/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNews: (newsId: number, data: any) =>
    apiRequest(`/api/news/admin/${newsId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNews: (newsId: number) =>
    apiRequest(`/api/news/admin/${newsId}`, { method: 'DELETE' }),
};

// ============================================
// WIKI API
// ============================================
export const wikiApi = {
  getCategories: () =>
    apiRequest('/api/wiki/categories'),

  getArticlesByCategory: (categorySlug: string) =>
    apiRequest(`/api/wiki/categories/${categorySlug}/articles`),

  getArticleBySlug: (slug: string) =>
    apiRequest(`/api/wiki/articles/${slug}`),

  searchArticles: (query: string) =>
    apiRequest(`/api/wiki/search?query=${encodeURIComponent(query)}`),

  // Admin
  getAllArticlesAdmin: () =>
    apiRequest('/api/wiki/admin/all'),

  createArticle: (data: any) =>
    apiRequest('/api/wiki/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArticle: (articleId: number, data: any) =>
    apiRequest(`/api/wiki/admin/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArticle: (articleId: number) =>
    apiRequest(`/api/wiki/admin/${articleId}`, { method: 'DELETE' }),
};

// ============================================
// FAQs API
// ============================================
export const faqApi = {
  getFAQs: () =>
    apiRequest('/api/faqs'),

  searchFAQs: (query: string) =>
    apiRequest(`/api/faqs/search?query=${encodeURIComponent(query)}`),

  getCategories: () =>
    apiRequest('/api/faqs/categories'),

  // Admin
  getAllFAQsAdmin: () =>
    apiRequest('/api/faqs/admin/all'),

  createFAQ: (data: any) =>
    apiRequest('/api/faqs/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFAQ: (faqId: number, data: any) =>
    apiRequest(`/api/faqs/admin/${faqId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFAQ: (faqId: number) =>
    apiRequest(`/api/faqs/admin/${faqId}`, { method: 'DELETE' }),
};

// ============================================
// DOWNLOADS API
// ============================================
export const downloadsApi = {
  getDownloads: () =>
    apiRequest('/api/downloads'),

  registerDownload: (downloadId: number) =>
    apiRequest(`/api/downloads/${downloadId}/register`, { method: 'POST' }),

  getCategories: () =>
    apiRequest('/api/downloads/categories'),

  // Admin
  getAllDownloadsAdmin: () =>
    apiRequest('/api/downloads/admin/all'),

  createDownload: (data: any) =>
    apiRequest('/api/downloads/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDownload: (downloadId: number, data: any) =>
    apiRequest(`/api/downloads/admin/${downloadId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDownload: (downloadId: number) =>
    apiRequest(`/api/downloads/admin/${downloadId}`, { method: 'DELETE' }),
};

// ============================================
// RULES API
// ============================================
export const rulesApi = {
  getRules: () =>
    apiRequest('/api/rules'),

  getSections: () =>
    apiRequest('/api/rules/sections'),

  // Admin
  getAllRulesAdmin: () =>
    apiRequest('/api/rules/admin/all'),

  createRule: (data: any) =>
    apiRequest('/api/rules/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRule: (ruleId: number, data: any) =>
    apiRequest(`/api/rules/admin/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRule: (ruleId: number) =>
    apiRequest(`/api/rules/admin/${ruleId}`, { method: 'DELETE' }),
};

// ============================================
// SUPPORT API
// ============================================
export const supportApi = {
  createTicket: (data: { name: string; email: string; subject: string; message: string }) =>
    apiRequest('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyTickets: () =>
    apiRequest('/api/support/tickets/my'),

  getTicketById: (ticketId: number) =>
    apiRequest(`/api/support/tickets/${ticketId}`),

  addResponse: (ticketId: number, message: string) =>
    apiRequest(`/api/support/tickets/${ticketId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Admin
  getAllTicketsAdmin: (status?: string, priority?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    return apiRequest(`/api/support/admin/tickets?${params.toString()}`);
  },

  updateTicketStatus: (ticketId: number, data: { status?: string; priority?: string }) =>
    apiRequest(`/api/support/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTicket: (ticketId: number) =>
    apiRequest(`/api/support/admin/tickets/${ticketId}`, { method: 'DELETE' }),
};

// ============================================
// USER MANAGEMENT API (Admin)
// ============================================
export const userManagementApi = {
  getUsers: (page = 1, limit = 20, search = '') =>
    apiRequest(`/api/admin/users/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  getUserById: (userId: number) =>
    apiRequest(`/api/admin/users/users/${userId}`),

  updateUserRole: (userId: number, groupId: number) =>
    apiRequest(`/api/admin/users/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ groupId }),
    }),

  toggleUserBlock: (userId: number) =>
    apiRequest(`/api/admin/users/users/${userId}/block`, { method: 'PATCH' }),

  addPremiumDays: (userId: number, days: number) =>
    apiRequest(`/api/admin/users/users/${userId}/premium`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    }),

  deleteUser: (userId: number) =>
    apiRequest(`/api/admin/users/users/${userId}`, { method: 'DELETE' }),

  getRoles: () =>
    apiRequest('/api/admin/users/roles'),

  getPermissions: () =>
    apiRequest('/api/admin/users/permissions'),

  assignPermissionsToRole: (groupId: number, permissionIds: number[]) =>
    apiRequest(`/api/admin/users/roles/${groupId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    }),

  getStats: () =>
    apiRequest('/api/admin/users/stats'),
};
