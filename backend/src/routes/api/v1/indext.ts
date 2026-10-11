import express from "express";

export const createV1Router = (
  authRouter: express.Router,
  userRouter: express.Router,
) => {
  const router = express.Router();

  router.use("/auth", authRouter);
  router.use("/users", userRouter);
  // Later: router.use("/products", productRouter);
  // Later: router.use("/orders", orderRouter);

  return router;
};
