import type {
  RefreshToken,
  RefreshTokenCreationInput,
  RefreshTokenUpdateInput,
  ROLES,
  TokenPayload,
  User,
  UserCreationInput,
  UserUpdateInput,
} from "./types.js";

export interface IUserRepository {
  findOne: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  create: (data: UserCreationInput) => Promise<User>;
  update: (id: string, data: UserUpdateInput) => Promise<User>;
  delete: (id: string) => Promise<boolean>;
}

export interface IUserService {
  get: (id: string) => Promise<User | null>;
  new: (data: UserCreationInput) => Promise<{
    id: string;
    email: string;
    role: ROLES;
    profilePicture: string;
  }>;
  update: (id: string, data: UserUpdateInput) => Promise<User>;
  delete: (id: string) => Promise<boolean>;
  changePassword: (data: {
    id: string;
    newPassword: string;
    oldPassword: string;
  }) => Promise<User>;
}

export interface IRefreshTokenRepository {
  purgeTokens: (id: string) => Promise<boolean>;
  findOne: (id: string) => Promise<RefreshToken | null>;
  create: (data: RefreshTokenCreationInput) => Promise<RefreshToken>;
  update: (id: string, data: RefreshTokenUpdateInput) => Promise<RefreshToken>;
  delete: (id: string) => Promise<boolean>;
}

export interface IAuthService {
  login: (data: {
    email: string;
    password: string;
  }) => Promise<{ refreshToken: string; accessToken: string }>;
  logout: (refreshToken: string) => Promise<boolean>;
  refreshAccessToken: (refreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string | null;
  } | null>;
  validateAccessToken: (accessToken: string) => Promise<TokenPayload | null>;
}
