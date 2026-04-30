import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PartnerUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
}

interface PartnerAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  baseUrl: string | null;
  user: PartnerUser | null;
}

const initialState: PartnerAuthState = {
  isAuthenticated: false,
  accessToken: null,
  baseUrl: null,
  user: null,
};

const partnersAuthSlice = createSlice({
  name: "partnersAuth",
  initialState,
  reducers: {
    /**
     * Called once the partner session/token is resolved (e.g. on mount or after
     * a successful login).
     */
    syncFromSession(
      state,
      action: PayloadAction<{
        user: PartnerUser;
        accessToken: string | null;
        baseUrl: string | null;
      }>,
    ) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.baseUrl = action.payload.baseUrl;
    },

    /**
     * Called when the partner session is cleared (logout / expiry).
     */
    clearSession(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.baseUrl = null;
      state.user = null;
    },

    // Granular setters (kept for call-sites that update a single field)

    setPartnersToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },

    setPartnersBaseUrl(state, action: PayloadAction<string>) {
      state.baseUrl = action.payload;
    },
  },
});

export const partnersAuthActions = partnersAuthSlice.actions;
export default partnersAuthSlice.reducer;
