import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    permissions?: string[];
    roleId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      permissions: string[];
      roleId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    permissions?: string[];
    roleId?: string | null;
  }
}