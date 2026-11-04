import axios from 'axios';
import { SessionKey } from '../models/sellWizardEnums';

const apiClient = axios.create({
  timeout: 10000,
});

// Automatically inject JWT Token into all outbound API headers if it exists
apiClient.interceptors.request.use(
  (config) => {
    // FIX: Read dynamically from sessionStorage instead of localStorage
    const token = sessionStorage.getItem(SessionKey.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
