import * as usersService from "./users.service.js";
import { usersQuerySchema, updateUserRoleSchema } from "./users.validation.js";

export const getUsers = async (req, res) => {
  try {
    const { page, limit, search } = usersQuerySchema.parse(req.query);
    const result = await usersService.getUsersWithPagination(page, limit, search);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await usersService.getUserById(id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role } = updateUserRoleSchema.parse(req.body);
    const user = await usersService.updateUserRole(id, role);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await usersService.deleteUser(id, req.user.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
