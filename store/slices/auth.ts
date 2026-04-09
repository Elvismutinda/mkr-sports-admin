import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "light" | "dark" | "auto";

interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  // Kept for backwards compat — populated from the next-auth JWT via syncFromSession
  userToken: string | null;
  isOnline: boolean;
  theme: {
    preference: ThemePreference;
    active: "light" | "dark";
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  userToken: null,
  isOnline: true,
  theme: {
    preference: "auto",
    active: "light",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Called once on mount from <AuthWrapper> after useSession() resolves.
     * Populates user + token so existing selectors (state["auth"].userToken etc.)
     * continue to work without changes.
     */
    syncFromSession(
      state,
      action: PayloadAction<{
        user: AuthUser;
        token: string | null;
      }>,
    ) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.userToken = action.payload.token;
    },

    /**
     * Called when next-auth session becomes null (signOut / expired).
     */
    clearSession(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.userToken = null;
    },

    setIsOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },

    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme.active = action.payload;
    },

    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.theme.preference = action.payload;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;