/**
 * API utility module for making authenticated requests with JWT tokens.
 * Automatically includes the access token from localStorage in request headers.
 */

const API_BASE_URL = "http://localhost:8000/api";

/**
 * Get the access token from localStorage
 * @returns {string|null} The access token or null if not found
 */
export function getAccessToken() {
  return localStorage.getItem("access");
}

/**
 * Get the refresh token from localStorage
 * @returns {string|null} The refresh token or null if not found
 */
export function getRefreshToken() {
  return localStorage.getItem("refresh");
}

/**
 * Check if user is authenticated (has an access token)
 * @returns {boolean} True if user has an access token
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Clear authentication tokens from localStorage
 */
export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint (e.g., "/rewards/account/")
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} The fetch response
 */
export async function authenticatedFetch(endpoint, options = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token found. User must be logged in.");
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If unauthorized (401), token might be expired
  if (response.status === 401) {
    // TODO: Implement token refresh logic here if needed
    // For now, just clear auth and throw error
    clearAuth();
    throw new Error("Authentication failed. Please login again.");
  }

  return response;
}

/**
 * Make an authenticated GET request
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiGet(endpoint) {
  const response = await authenticatedFetch(endpoint, {
    method: "GET"
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

/**
 * Make an authenticated POST request
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The data to send in the request body
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiPost(endpoint, data) {
  const response = await authenticatedFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

/**
 * Fetch the current user's reward account information
 * @returns {Promise<{id: number, username: string, reward_points: number}>}
 */
export async function fetchRewardAccount() {
  return apiGet("/rewards/account/");
}

/**
 * Fetch available exchange items
 * @returns {Promise<Array>}
 */
export async function fetchExchangeItems() {
  return apiGet("/rewards/items/");
}

/**
 * Redeem a reward item
 * @param {number} itemId - The item ID to redeem
 * @param {number} quantity - The quantity to redeem
 * @returns {Promise<object>} The redemption details
 */
export async function redeemReward(itemId, quantity = 1) {
  return apiPost("/rewards/redeem/", { item_id: itemId, quantity });
}

/**
 * Update the current user's profile
 * @param {object} data - Profile data to update (e.g., { username: "newName" })
 * @returns {Promise<object>} The updated profile details
 */
export async function updateProfile(data) {
  const response = await authenticatedFetch("/profile/update/", {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}
