import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import type {
  IAuthService,
  IRefreshTokenRepository,
  IUserRepository,
} from "../interfaces.js";
import bcrypt from "bcrypt";
import { InvalidCredentialsError } from "../helpers/errors.js";
import type { TokenPayload } from "../types.js";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService implements IAuthService {
  constructor(
    private readonly tokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  // authentication
  async login(data: { email: string; password: string }) {
    // 1. check password validity
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }
    // 2. create a tokens
    const [refreshToken, accessToken] = await Promise.all([
      this.createRefreshToken(user.id),
      this.createAccessToken(user.id),
    ]);
    // 3. return credentials accordingly
    return {
      refreshToken,
      accessToken,
    };
  }

  async logout(refreshToken: string) {
    // 1. check token validity
    const payload = await this.validateRefreshToken(refreshToken);
    if (!payload) {
      return false;
    }
    // 2. drop used refreshToken
    await this.tokenRepository.delete(payload.jti!);
    // 3. return operation status
    return true;
  }

  // refresh token methods
  private async validateRefreshToken(refreshToken: string) {
    // 1. Verify JWT signature + exp
    let payload: TokenPayload;

    try {
      payload = jwt.verify(
        refreshToken,
        process.env["REFRESH_TOKEN_SECRET"]!,
      ) as TokenPayload;
    } catch {
      return null;
    }

    // 2. Find token/session in DB
    const token = await this.tokenRepository.findOne(payload.jti!);

    if (!token) {
      return null;
    }

    // 3. Verify the actual token against its hash
    const hash = hashToken(refreshToken);

    if (hash !== token.tokenHash) {
      return null;
    }

    // 4. Return payload
    return payload;
  }

  private async createRefreshToken(userId: string) {
    // 1. Create token ID
    const tokenId = randomUUID();

    // 2. Create JWT
    const token = jwt.sign(
      {
        data: {
          userId,
        },
        jti: tokenId,
      },
      process.env["REFRESH_TOKEN_SECRET"]!,
      { expiresIn: "30d" },
    );

    // 3. Hash token
    const hashedToken = hashToken(token);

    // 4. Store token
    await this.tokenRepository.create({
      id: tokenId,
      tokenHash: hashedToken,
      userId,
    });

    // 5. Return token
    return token;
  }

  private async recreateRefreshToken(oldRefreshToken: string) {
    // 1. Validate old refresh token
    const payload = await this.validateRefreshToken(oldRefreshToken);

    if (!payload || !payload.jti) {
      return null;
    }

    // 2. Create a new JWT using the SAME jti
    //    because we're replacing the existing DB session
    const newToken = jwt.sign(
      {
        data: {
          userId: payload.data.userId,
        },
        jti: payload.jti,
      },
      process.env["REFRESH_TOKEN_SECRET"]!,
      { expiresIn: "30d" },
    );

    // 3. Replace the stored hash
    await this.tokenRepository.update(payload.jti, {
      tokenHash: hashToken(newToken),
    });

    // 4. Return new token
    return newToken;
  }

  // access token methods
  private async createAccessToken(userId: string) {
    const newToken = jwt.sign(
      {
        data: {
          userId,
        },
      },
      process.env["ACCESS_TOKEN_SECRET"]!,
      {
        expiresIn: "15m",
      },
    );

    return newToken;
  }

  async refreshAccessToken(refreshToken: string) {
    // 1. Validate refresh token
    const payload = await this.validateRefreshToken(refreshToken);

    if (!payload) {
      return null;
    }

    // 2. Create a new access token
    const accessToken = await this.createAccessToken(payload.data.userId);

    // 3. Rotate refresh token when it has <= 7 days remaining
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = (payload.exp ?? 0) - now;
    const sevenDays = 7 * 24 * 60 * 60;

    if (remainingSeconds <= sevenDays) {
      const newRefreshToken = await this.recreateRefreshToken(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    }

    return {
      accessToken,
      refreshToken: null,
    };
  }

  async validateAccessToken(token: string) {
    try {
      const payload = jwt.verify(
        token,
        process.env["ACCESS_TOKEN_SECRET"]!,
      ) as TokenPayload;

      return payload;
    } catch {
      return null;
    }
  }
}

export const createAuthService = (
  tokenRepository: IRefreshTokenRepository,
  userRepository: IUserRepository,
) => {
  return new AuthService(tokenRepository, userRepository);
};
