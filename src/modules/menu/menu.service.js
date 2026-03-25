import * as menuRepository from "./menu.repository.js";

export const createMenu = async (data) => {
  return await menuRepository.createMenu(data);
};

export const updateMenu = async (id, data) => {
  const existing = await menuRepository.getMenuById(id);
  if (!existing) {
    throw new Error("Menu is not found!");
  }

  return await menuRepository.updateMenu(id, data);
};

export const getMenuById = async (id) => {
  const menu = await menuRepository.getMenuById(id);
  if (!menu) {
    throw new Error("Menu not found");
  }
  return menu;
};

export const getMenusWithPagination = async (page, limit) => {
  const menus = await menuRepository.getMenus(page, limit);

  const totalData = await menuRepository.getPages(limit);
  return {
    page,
    limit,
    total_pages: Number(totalData.total_pages),
    data: menus,
  };
};

export const deleteMenu = async (id) => {
  const existing = await menuRepository.getMenuById(id);
  if (!existing) {
    throw new Error("Menu not found");
  }

  await menuRepository.deleteMenu(id);
};
