
const API_URL = import.meta.env.VITE_API_URL || 'https://collab-docs-backend-32yq.onrender.com/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any, isRetry: boolean = false): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401 && !isRetry) {
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });

                    if (refreshResponse.ok) {
                        const data = await refreshResponse.json();
                        // Update tokens
                        localStorage.setItem('token', data.data.accessToken);
                        if (data.data.refreshToken) {
                            localStorage.setItem('refreshToken', data.data.refreshToken);
                        }

                        // Retry original request
                        return request<T>(endpoint, method, body, true);
                    }
                } catch (error) {
                    console.error('Token refresh failed:', error);
                }
            }

            // Handle unauthorized (redirect to login or clear token)
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');

            if (!window.location.pathname.includes('/auth')) {
                window.location.href = '/auth';
            }
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const apiClient = {
    get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, 'POST', body),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PUT', body),
    patch: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PATCH', body),
    delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};
