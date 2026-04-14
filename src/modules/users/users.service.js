import * as usersRepository from "./users.repository.js";

export const getUsersWithPagination = async (page, limit, search = "") => {
  const users = await usersRepository.getUsers(page, limit, search);
  const totalData = await usersRepository.getUsersPages(limit, search);

  return {
    page,
    limit,
    search,
    total_pages: Number(totalData.total_pages),
    data: users,
  };
};

export const getUserById = async (id) => {
  const user = await usersRepository.getUserById(id);
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserRole = async (id, role) => {
  const user = await getUserById(id);
  if (user.role === role) return user;

  return await usersRepository.updateUserRole(id, role);
};

export const deleteUser = async (id, requesterId) => {
  if (id === requesterId) {
    throw new Error("Cannot delete your own account");
  }

  await getUserById(id);
  await usersRepository.deleteUser(id);
};
