// Runtime environment configuration
// During development, we use Vite's import.meta.env
// In production (Docker), we use the window._env_ object injected by env.sh

const config = {
    API_BASE: (window._env_ && window._env_.VITE_API_URL) 
        ? window._env_.VITE_API_URL 
        : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1')
};

export default config;
