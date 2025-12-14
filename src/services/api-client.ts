
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any): Promise<T> {
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
        if (response.status === 401) {
            // Handle unauthorized (redirect to login or clear token)
            localStorage.removeItem('token');
            window.location.href = '/auth';
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
