import axios from 'axios';
import './echo';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.axios.interceptors.request.use((config) => {
    const socketId = window.Echo?.socketId();
    if (socketId) {
        config.headers.set('X-Socket-ID', socketId);
    }
    return config;
});

window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config as (typeof error.config & { _csrfRetry?: boolean }) | undefined;
        if (error.response?.status === 419 && config && !config._csrfRetry) {
            config._csrfRetry = true;
            await window.axios.get('/sanctum/csrf-cookie');
            return window.axios.request(config);
        }
        return Promise.reject(error);
    },
);
