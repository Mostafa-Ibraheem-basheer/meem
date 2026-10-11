import type { IAuthService } from "../interfaces.js";
import type { Request, Response } from "express";
import { loginDetailsSchema } from "../schemas/auth.js";
import { InvalidCredentialsError } from "../helpers/errors.js";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = async (req: Request, res: Response) => {
    // 1. validate inputs
    const result = loginDetailsSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: `Invalid Credentials ${result.error.message}` });
    }

    try {
      // 2. hand the data to service
      const tokens = await this.authService.login(result.data);
      // 3. send tokens appropriately if success
      return res
        .status(200)
        .cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env["NODE_ENV"] === "production",
          sameSite: "strict",
          path: "/auth",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        })
        .json({
          message: "Logged in Successfully!",
          token: tokens.accessToken,
        });
    } catch (error) {
      // 4. translate errors if failure
      if (error instanceof InvalidCredentialsError) {
        return res.status(401).json({ message: error.message });
      }

      return res
        .status(500)
        .json({ message: "An unexpected error occured, please try again" });
    }
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refreshToken"];

    const loggedOut = await this.authService.logout(refreshToken);

    if (!loggedOut) {
      return res.status(401).json({ message: "Already logged out" });
    }

    return res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        path: "/auth",
      })
      .status(200)
      .json({ message: "See you soon!" });
  };

  refreshAccessToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refreshToken"];

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is missing",
      });
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    if (!tokens) {
      return res.status(401).json({
        message: "Couldn't refresh access token due to invalid refresh token",
      });
    }

    if (tokens.refreshToken) {
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        path: "/auth",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      message: "Token Regenerated!",
      token: tokens.accessToken,
    });
  };
}
