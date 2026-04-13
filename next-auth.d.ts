import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface User {
    permissions?: string[];
    roleId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      permissions: string[];
      roleId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    permissions?: string[];
    roleId?: string | null;
  }
}
