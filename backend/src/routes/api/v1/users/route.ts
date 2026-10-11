import express, { type RequestHandler } from "express";
import { UserController } from "../../../../controllers/userController.js";
import type { IUserRepository } from "../../../../interfaces.js";
import { UserService } from "../../../../services/userService.js";

export const createUserRouter = (
  // Dependencies are injected into the router factory,
  // so the router doesn't construct them itself.
  // This also makes the router easy to test with fake implementations.
  userRepository: IUserRepository,
  auth: RequestHandler,
) => {
  const router = express.Router();

  const service = new UserService(userRepository);
  const controller = new UserController(service);

  router.post("/register", controller.register);

  router.use(auth);

  router.get("/", controller.profile);
  router.patch("/", controller.updateProfile);
  router.delete("/", controller.deactivateAccount);
  router.patch("/password", controller.changePassword);

  return router;
};
