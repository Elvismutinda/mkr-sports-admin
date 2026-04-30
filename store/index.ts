import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist/es/constants";
import storage from "@/store/customeStorage";
import hardSet from "redux-persist/es/stateReconciler/hardSet";
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/auth";
import permissionReducer from "@/store/slices/permissionSlice";
import partnersAuthReducer from "@/store/slices/partnersAuth";
import { persistReducer, persistStore } from "redux-persist";
import type { PersistConfig } from "redux-persist";

const rootReducer = combineReducers({
  auth: authReducer,
  permissions: permissionReducer,
  partnersAuth: partnersAuthReducer,
});

// Derive RootState from the unpersisted reducer so TypeScript keeps
// the full slice shapes rather than the PersistPartial wrapper.
export type RootState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: "ar437957497497549759c05057703753503757353434",
  storage,
  blacklist: ["toast"],
  stateReconciler: hardSet,
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;

const persistor = persistStore(store);

export { store, persistor };