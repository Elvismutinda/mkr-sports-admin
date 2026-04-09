import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { Permission } from "@/_utils/enums/permissions.enum";
import type { AppDispatch } from "@/store";

interface JwtPayload {
  sub?: string;
  permissions?: string[];
  exp?: number;
}

interface PermissionState {
  permissions: string[];
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  isSuperAdmin: false,
  loading: false,
  error: null,
};

export const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    loadPermissionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loadPermissionsSuccess: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      state.isSuperAdmin = action.payload.includes(Permission.SUPER_ADMIN);
      state.loading = false;
    },
    loadPermissionsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearPermissions: (state) => {
      state.permissions = [];
      state.isSuperAdmin = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  loadPermissionsStart,
  loadPermissionsSuccess,
  loadPermissionsFailure,
  clearPermissions,
} = permissionSlice.actions;

export const loadPermissionsFromToken =
  (token: string | null) =>
  (dispatch: AppDispatch) => {
    dispatch(loadPermissionsStart());
    try {
      if (!token) {
        dispatch(loadPermissionsSuccess([]));
        return;
      }
      const decoded = jwtDecode<JwtPayload>(token);
      dispatch(loadPermissionsSuccess(decoded.permissions ?? []));
    } catch (error) {
      dispatch(loadPermissionsFailure((error as Error).message));
    }
  };

export const loadPermissionsFromArray =
  (permissions: string[]) =>
  (dispatch: AppDispatch) => {
    dispatch(loadPermissionsSuccess(permissions));
  };

export default permissionSlice.reducer;