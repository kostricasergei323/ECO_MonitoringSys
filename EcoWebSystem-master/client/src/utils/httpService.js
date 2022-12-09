import axios from 'axios';
import { useContext } from 'react';
import { LoaderContext } from '../components/context/loaderContext';

async function post(url, body) {
  return axios.post(url, body);
}

const useGet = () => {
  const { isLoading, loadingText } = useContext(LoaderContext);

  return async (url) => {
    isLoading.current = true;
    loadingText.current = url.split('?')[0];
    return axios.get(url);
  };
};

async function get(url) {
  return axios.get(url);
}

async function put(url, body) {
  return axios.put(url, body);
}

async function deleteRequest(url, body) {
  return axios.delete(url);
}

export { useGet, post, get, put, deleteRequest };
