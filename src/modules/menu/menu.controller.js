import * as menuService from "./menu.service.js";
import {
  createMenuSchema,
  paginationSchema,
  updateMenuSchema,
} from "./menu.validation.js";

export const createMenu = async (req, res) => {
  try {
    const data = createMenuSchema.parse(req.body);
    const menu = await menuService.createMenu(data);
    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`\n  UPDATE BY ID ${id}`);
    const data = updateMenuSchema.parse(req.body);

    const menu = await menuService.updateMenu(id, data);

    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMenuById = async (req, res) => {
  try {
    const id = req.params.id;

    const menu = await menuService.getMenuById(id);
    res.json(menu);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getMenus = async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await menuService.getMenusWithPagination(page, limit);

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`\n  DELETE BY ID ${id}`);
    await menuService.deleteMenu(id);

    res.json({ message: "Menu deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
