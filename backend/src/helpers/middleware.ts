import type { NextFunction, Request, Response } from "express";
import type { IAuthService } from "../interfaces.js";
import "../types.js";

export const createAuthMiddleware = (authService: IAuthService) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    //1- get the token from the request
    const authorization = req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        message: "Authorization token is missing",
      });
      return;
    }

    // 2- scheme = 'bearer' token = 'eyJeaDes%.....'
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        message: "Invalid authorization header",
      });
      return;
    }

    // 3- validate token signature
    const payload = await authService.validateAccessToken(token);

    if (!payload) {
      res.status(401).json({
        message: "Invalid or expired access token",
      });
      return;
    }

    // 4- add the token payload (in our case the user id) to the request again so that we benefit from the token's data
    req.user = payload;

    next();
  };
};
