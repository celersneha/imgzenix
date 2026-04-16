import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import folderReducer from "./slices/folderSlice";
import imageReducer from "./slices/imageSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    folder: folderReducer,
    image: imageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
