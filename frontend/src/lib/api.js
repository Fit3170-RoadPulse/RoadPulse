/**
 * API utility module for making authenticated requests with JWT tokens.
 * Automatically includes the access token from localStorage in request headers.
 */

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "https://roadpulsebackend.onrender.com"}/api`;

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
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };

  // Only add Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // If unauthorized (401), token might be expired
    if (response.status === 401) {
      clearAuth();
      throw new Error("Authentication failed. Please login again.");
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out");
    }
    throw error;
  }
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
 * @param {object|FormData} data - The data to send in the request body
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiPost(endpoint, data) {
  const response = await authenticatedFetch(endpoint, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data)
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
 * Make an authenticated PUT request
 * @param {string} endpoint - The API endpoint
 * @param {object|FormData} data - The data to send in the request body
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiPut(endpoint, data) {
  const response = await authenticatedFetch(endpoint, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data)
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
 * Make an authenticated DELETE request
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiDelete(endpoint) {
  const response = await authenticatedFetch(endpoint, {
    method: "DELETE"
  });

  if (!response.ok && response.status !== 204) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  // 204 No Content responses have no body
  if (response.status === 204) {
    return { success: true };
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
 * Fetch the current user's reward redemptions (vouchers)
 * @returns {Promise<Array>}
 */
export async function fetchUserRedemptions() {
  return apiGet("/rewards/redemptions/");
}

/**
 * Mark a voucher as redeemed
 * @param {number} redemptionId - The ID of the voucher/redemption
 * @returns {Promise<object>}
 */
export async function markVoucherAsRedeemed(redemptionId) {
  return apiPatch(`/rewards/redemptions/${redemptionId}/redeem/`, {});
}

/**
 * Make an authenticated PATCH request
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The data to send in the request body
 * @returns {Promise<any>} The parsed JSON response
 */
export async function apiPatch(endpoint, data) {
  const response = await authenticatedFetch(endpoint, {
    method: "PATCH",
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
 * Update the current user's profile
 * @param {object} data - Profile data to update (e.g., { username: "newName" })
 * @returns {Promise<object>} The updated profile details
 */
export async function updateProfile(data) {
  return apiPut("/profile/update/", data);
}

// --- Admin Rewards Management ---

/**
 * Fetch all rewards for admin (including inactive ones)
 * @returns {Promise<Array>}
 */
export async function fetchAdminRewards() {
  return apiGet("/admin/rewards/");
}

/**
 * Create a new reward (admin only)
 * @param {FormData} formData - The reward data including image
 * @returns {Promise<object>}
 */
export async function createReward(formData) {
  return apiPost("/admin/rewards/", formData);
}

/**
 * Update a reward (admin only)
 * @param {number} rewardId - The ID of the reward to update
 * @param {FormData} formData - The updated reward data
 * @returns {Promise<object>}
 */
export async function updateReward(rewardId, formData) {
  return apiPut(`/admin/rewards/${rewardId}/`, formData);
}

/**
 * Delete a reward (admin only)
 * @param {number} rewardId - The ID of the reward to delete
 * @returns {Promise<object>}
 */
export async function deleteReward(rewardId) {
  return apiDelete(`/admin/rewards/${rewardId}/`);
}
