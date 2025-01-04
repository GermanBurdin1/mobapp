import { configureStore } from '@reduxjs/toolkit';
import feedReducer from '../viewModels/feedSlice';
import userReducer from '../viewModels/userSlice';

const store = configureStore({
  reducer: {
    feed: feedReducer,
    user: userReducer,
  },
});

export default store;
