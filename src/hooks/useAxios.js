// client/src/hooks/useAxios.js
import { useEffect } from 'react';
import api from '../utils/api';
import { auth } from '../utils/firebase';

const useAxios = () => {
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, []);

  return api;
};

export default useAxios;
