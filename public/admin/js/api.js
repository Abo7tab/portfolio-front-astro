const _isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
// Forced to Live Backend for testing as requested:
const LIVE_BACKEND_URL = 'https://folio.alwaysdata.net';
const REQUEST_TIMEOUT_MS = 15000;
const API_BASE_URL = `${LIVE_BACKEND_URL}/api`;
const IMG_BASE_URL = LIVE_BACKEND_URL;

console.log('[ADMIN API DEBUG] API_BASE_URL loaded:', API_BASE_URL);

function canRetryRequest(endpoint, method) {
    return method === 'GET' || endpoint === '/login';
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
            console.log('[ADMIN API DEBUG] Fetching:', requestUrl);

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
                        console.warn(`[ADMIN API DEBUG] Retrying request (${attempt + 1}/${maxAttempts}):`, requestUrl);
                        await wait(700);
                        continue;
                    }

                    throw fetchError;
                } finally {
                    clearTimeout(timeoutId);
                }
            }

            console.log('[ADMIN API DEBUG] Response Status:', {
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
                result = {
                    message: `Expected JSON but received ${contentType || 'unknown content type'} from ${requestUrl}. Preview: ${text.slice(0, 180)}`
                };
            }

            if (!response.ok) {
                throw new Error(result.message || `Request failed with status ${response.status}`);
            }

            return result;
        } catch (error) {
            if (error?.name === 'AbortError') {
                error = new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${requestUrl}`);
            }

            console.error('[ADMIN API DEBUG] API Error:', {
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
    static async getProjects() { return this.request('/projects'); }
    static async getSkills() { return this.request('/skills'); }
    static async getCertificates() { return this.request('/certificates'); }
    static async getCategories() { return this.request('/categories'); }
    static async getPersonalInfo() { return this.request('/personal-info'); }
    static async getSocialLinks() { return this.request('/social-links'); }
    static async getDashboardStats() { return this.request('/dashboard/stats', 'GET', null, true); }

    // Admin Helpers
    static async login(email, password) {
        const result = await this.request('/login', 'POST', { email, password });
        if (result.token) {
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('user_data', JSON.stringify(result.user));
        }
        return result;
    }

    static async logout() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await this.request('/logout', 'POST', null, true);
            } catch (e) {
                console.warn('Logout API call failed', e);
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/admin/login.html';
    }
}
