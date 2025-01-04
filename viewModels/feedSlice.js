import { createSlice } from '@reduxjs/toolkit';

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    loading: false,
  },
  reducers: {
    setFeed: (state, action) => {
      state.posts = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setFeed, setLoading } = feedSlice.actions;
export default feedSlice.reducer;
