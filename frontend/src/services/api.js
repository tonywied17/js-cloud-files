import axios from 'axios';

const API_URL = 'http://localhost:3222/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async ({ username, password }) => {
  try {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const loginUser = async ({ username, password }) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getPublicFiles = async () => {
  try {
    const response = await api.get('/files/public');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPrivateFiles = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }

    const response = await api.get('/files/private', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(response.data)
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadFileChunk = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/files/upload/chunk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};