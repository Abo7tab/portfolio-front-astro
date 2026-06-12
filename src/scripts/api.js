/**
 * Portfolio API Client
 * Handles all communication with the Laravel backend.
 */

const REQUEST_TIMEOUT_MS = 15000;

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function canRetryRequest(endpoint, method) {
  return method === 'GET' || endpoint === '/login';
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const API_BASE_URL = 'https://folio.alwaysdata.net/api';
const IMG_BASE_URL = 'https://folio.alwaysdata.net';

console.log('[API DEBUG] API_BASE_URL loaded:', API_BASE_URL);

class API {
  static async request(endpoint, method = 'GET', data = null, requireAuth = false) {
    const requestUrl = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Accept': 'application/json'
    };

    if (data && !(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (requireAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('Authentication token missing for protected route.');
      }
    }

    const config = {
      method: method,
      headers: headers
    };

    if (data) {
      config.body = (data instanceof FormData) ? data : JSON.stringify(data);
    }

    try {
      console.log('[API DEBUG] Fetching data from:', requestUrl);
      console.log('[API DEBUG] Request details:', {
        endpoint,
        method,
        requireAuth,
        hasBody: Boolean(data),
        isFormData: data instanceof FormData,
        headers
      });

      const maxAttempts = canRetryRequest(endpoint, method) ? 2 : 1;
      let response;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let timeoutId;

        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          response = await fetch(requestUrl, { ...config, signal: controller.signal });
          break;
        } catch (fetchError) {
          if (fetchError?.name === 'AbortError') {
            fetchError = new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${requestUrl}`);
          }

          if (attempt < maxAttempts) {
            console.warn(`[API DEBUG] Retrying request (${attempt + 1}/${maxAttempts}):`, requestUrl);
            await wait(700);
            continue;
          }

          throw fetchError;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      console.log('[API DEBUG] Response Status:', {
        url: requestUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const text = await response.text();

        if (text.includes('/aes.js') || text.includes('__test=')) {
          throw new Error('OpenResty returned a JavaScript bot-protection challenge instead of API JSON. Disable bot protection for /api/* or whitelist the API path/domain in hosting.');
        }

        result = { message: text };
      }

      if (!response.ok) {
        throw new Error(result.message || `Request failed with status ${response.status}`);
      }

      console.log('[API DEBUG] Successful response from:', requestUrl);

      return result;
    } catch (error) {
      if (error?.name === 'AbortError') {
        error = new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${requestUrl}`);
      }

      console.error('[API DEBUG] API Error Details:', {
        url: requestUrl,
        endpoint,
        method,
        message: error?.message,
        stack: error?.stack,
        error
      });
      throw error;
    }
  }

  // Public Helpers
  static async getProjects()     { return this.request('/projects'); }
  static async getSkills()       { return this.request('/skills'); }
  static async getCertificates() { return this.request('/certificates'); }
  static async getCategories()   { return this.request('/categories'); }
  static async getPersonalInfo() { return this.request('/personal-info'); }
  static async getSocialLinks()  { return this.request('/social-links'); }
}

export { API, API_BASE_URL, IMG_BASE_URL };
