import {
  AlreadyExistsError,
  IncorrectPasswordError,
  NotFoundError,
} from "../helpers/errors.js";
import type { IUserService } from "../interfaces.js";
import {
  partialuserSchema,
  passwordUpdateSchema,
  userSchema,
} from "../schemas/user.js";
import type { Request, Response } from "express";

export class UserController {
  constructor(private readonly userService: IUserService) {}

  register = async (req: Request, res: Response) => {
    // 1. validate inputs
    const result = userSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: `Validation Error: ${result.error.message}` });
    }
    // 2. send to service
    try {
      // 3. translate result if success
      const user = await this.userService.new(result.data);
      return res
        .status(201)
        .json({ message: "User Created Successfully", user });
    } catch (error) {
      console.log(error);
      if (error instanceof AlreadyExistsError) {
        return res
          .status(error.status)
          .json({ message: `Validation Error: ${error.message}` });
      }

      return res.status(500).json({ message: "An unexpected error occured" });
    }
  };

  profile = async (req: Request, res: Response) => {
    const userId = req.user?.data.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await this.userService.get(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: `Could not find user with id ${userId}` });
    }
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    const userId = req.user?.data.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = partialuserSchema.safeParse(req.body);

    if (!result.success) {
      return res
        .status(400)
        .json({ message: `Validation Error: ${result.error.message}` });
    }

    if (Object.keys(result.data).length === 0) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided" });
    }

    try {
      const updatedUser = await this.userService.update(userId, result.data);

      const { passwordHash, ...safeUser } = updatedUser;

      return res
        .status(200)
        .json({ message: "User Updated Successfully", data: safeUser });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }

      if (error instanceof AlreadyExistsError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    const userId = req.user?.data.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = passwordUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: `Validation Error: ${result.error.message}` });
    }

    try {
      await this.userService.changePassword({
        id: userId,
        oldPassword: result.data.oldPassword,
        newPassword: result.data.newPassword,
      });
      return res
        .status(200)
        .json({ message: "User Password Updated Successfully!" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }

      if (error instanceof IncorrectPasswordError) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };

  deactivateAccount = async (req: Request, res: Response) => {
    const userId = req.user?.data.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const deleted = await this.userService.delete(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
}
