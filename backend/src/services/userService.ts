import { IncorrectPasswordError, NotFoundError } from "../helpers/errors.js";
import type { IUserRepository, IUserService } from "../interfaces.js";
import type { UserCreationInput, UserUpdateInput } from "../types.js";
import bcrypt from "bcrypt";

export class UserService implements IUserService {
  constructor(private readonly repository: IUserRepository) {}

  async get(id: string) {
    return this.repository.findOne(id);
  }

  async new(data: UserCreationInput) {
    // 1. hash the user's password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    // 2. insert to database
    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
    });
    // 3. return created user to controller
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };
  }

  async update(id: string, data: UserUpdateInput) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async changePassword(data: {
    id: string;
    newPassword: string;
    oldPassword: string;
  }) {
    // 1. fetch user
    const user = await this.repository.findOne(data.id);
    if (!user) {
      throw new NotFoundError("user");
    }
    // 2. check old password
    const isCorrect = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isCorrect) {
      throw new IncorrectPasswordError();
    }
    // 3. hash and update password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    return this.repository.update(data.id, { password: hashedPassword });
  }
}
