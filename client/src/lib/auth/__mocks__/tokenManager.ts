export const TokenManager = {
  setTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  isTokenValid: jest.fn(),
  getCurrentUser: jest.fn(),
  clearTokens: jest.fn(),
  refreshToken: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn()
}