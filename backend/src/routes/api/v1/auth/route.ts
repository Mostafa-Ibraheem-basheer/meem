import express, { type RequestHandler } from "express";
import type { IAuthService } from "../../../../interfaces.js";
import { AuthController } from "../../../../controllers/authController.js";

export const createAuthRouter = (
  // Dependencies are injected into the router factory,
  // so the router doesn't construct them itself.
  // This also makes the router easy to test with fake implementations.
  service: IAuthService,
  auth: RequestHandler,
) => {
  const router = express.Router();

  const controller = new AuthController(service);

  router.post("/login", controller.login);
  router.post("/refresh", controller.refreshAccessToken);

  router.use(auth);

  router.post("/logout", controller.logout);
  return router;
};
