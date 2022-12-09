import React, { createContext } from 'react';

export const loadingInitialState = {
  isLoading: null,
  loadingText: null,
};

export const LoaderContext = createContext(loadingInitialState);
