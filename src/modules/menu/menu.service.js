import { deleteImage, uploadImage } from "../../utils/cloudinary.js";
import * as menuRepository from "./menu.repository.js";
import { deleteCache } from "../../utils/cache.js";

const invalidateMenusCache = async (id = null) => {
  await deleteCache("cache:/api/menus*"); // Hapus semua data di memory
};

export const createMenu = async (data) => {
  await invalidateMenusCache();
  return await menuRepository.createMenu(data);
};

export const updateMenu = async (id, data) => {
  const existing = await menuRepository.getMenuById(id);
  if (!existing) {
    throw new Error("Menu is not found!");
  }
  await invalidateMenusCache();
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
  await invalidateMenusCache();
};

export const uploadMenuPhoto = async (id, file) => {
  if (!file) {
    throw new Error("File tidak ditemukan");
  }
  const menu = await getMenuById(id);
  if (!menu) throw new Error("Menu tidak ditemukan");

  const result = await uploadImage(file.buffer);

  await menuRepository.updateMenuImage(id, result.secure_url, result.public_id);

  // INVALIDATE CACHE
  await invalidateMenusCache();

  return result.secure_url;
};

export const replaceMenuPhoto = async (id, file) => {
  if (!file) {
    throw new Error("File tidak ditemukan");
  }

  const menu = await getMenuById(id);

  //hapus foto lama
  await deleteImage(menu.image_path);

  // Upload foto baru
  const result = await uploadImage(file.buffer);

  await menuRepository.updateMenuImage(id, result.secure_url, result.public_id);

  // INVALIDATE CACHE
  await invalidateMenusCache();
  return result.secure_url;
};

export const deleteMenuPhoto = async (id) => {
  const menu = await getMenuById(id);
  if (!menu) throw new Error("Menu tidak ditemukan");

  await deleteImage(menu.image_path);
  await menuRepository.removeMenuImage(id);

  // INVALIDATE CACHE
  await invalidateMenusCache();
};
