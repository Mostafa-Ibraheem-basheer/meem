import type { JwtPayload } from "jsonwebtoken";

export type ROLES = "ADMIN" | "USER";

export type User = {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  role: ROLES;
  passwordHash: string;
};

export type UserCreationInput = {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  role?: ROLES;
};

export type UserUpdateInput = {
  [K in keyof UserCreationInput]?: UserCreationInput[K] | undefined;
};

export type RefreshToken = {
  id: string;
  tokenHash: string;
  userId: string;
};

export type RefreshTokenCreationInput = RefreshToken;
export type RefreshTokenUpdateInput = {
  tokenHash: string;
};

export type TokenPayload = JwtPayload & {
  jti?: string;
  data: {
    userId: string;
  };
};

export type UserSearchQueryParams = {
  email?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
