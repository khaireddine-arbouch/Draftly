import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { ReducersMapObject } from '@reduxjs/toolkit';
import { apis } from './api';
import { slices } from './slice/index';

// Assuming 'slices' and 'apis' are already defined arrays of reducers and API slices respectively.
const rootReducer = combineReducers({
  ...slices, // Assuming slices is an object of reducers
  ...apis.reduce((acc, api) => {
    acc[api.reducerPath] = api.reducer;
    return acc;
  }, {} as ReducersMapObject), // Ensure the proper type is used for the initial object
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(...apis.map((a) => a.middleware as Middleware)), // Add middleware from API slices
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production', // Enable devTools in non-production environments
  });
}

// AppStore type based on the store configuration
export type AppStore = ReturnType<typeof makeStore>;

// AppDispatch type to infer the dispatch function
export type AppDispatch = AppStore['dispatch'];


export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; // Custom typed useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>(); // Custom typed useDispatch