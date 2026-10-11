import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { UserRepository } from "./repositories/userRepository.js";
import { pool } from "./db.js";
import { RefreshTokenRepository } from "./repositories/refreshTokenRepository.js";
import { createAuthService } from "./services/authService.js";
import { createAuthMiddleware } from "./helpers/middleware.js";
import { createV1Router } from "./routes/api/v1/indext.js";
import { createAuthRouter } from "./routes/api/v1/auth/route.js";
import { createUserRouter } from "./routes/api/v1/users/route.js";

export const app = express();

// 1. Parse JSON payloads (Content-Type: application/json)
app.use(express.json());

// 2. Parse URL-encoded payloads (Content-Type: application/x-www-form-urlencoded) and init other important utils
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//3. global dependencies
const userRepository = new UserRepository(pool);
const tokenRepository = new RefreshTokenRepository(pool);

const authService = createAuthService(tokenRepository, userRepository);

//4. custom middlewares
const auth = createAuthMiddleware(authService);

//5. DI Composition in the root
// NOTICE HOW DEPENDENCY INJECTION WORK HERE, WE MADE A METHOD THAT CREATES THE ROUTER USING THE CLASSES
const authRouter = createAuthRouter(authService, auth);
const userRouter = createUserRouter(userRepository, auth);

//6. routes
// NOTICE THAT WE MOVED ALL ROUTE DECLERATIONS INSIDE A WRAPPER ROUTE SO WE CAN CREATE ENDPOINT VERSIONING
const v1Router = createV1Router(authRouter, userRouter);
app.use("/api/v1", v1Router);

app.get("/health", (_: Request, res: Response) => {
  res.status(200).json({ message: "Healthy" });
});
