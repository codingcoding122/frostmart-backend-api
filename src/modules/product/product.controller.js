import * as productService from "./product.service.js";
import {
  createProductSchema,
  paginationSchema,
  updateProductSchema,
} from "./product.validation.js";
import {
  uploadProductPhoto,
  replaceProductPhoto,
  deleteProductPhoto,
} from "./product.service.js";

export const createProduct = async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`\n  UPDATE BY ID ${id}`);
    const data = updateProductSchema.parse(req.body);

    const product = await productService.updateProduct(id, data);

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await productService.getProductById(id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);

    const result = await productService.getProductsWithPagination(
      page,
      limit,
      search,
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`\n  DELETE BY ID ${id}`);
    await productService.deleteProduct(id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    const url = await uploadProductPhoto(Number(req.params.id), req.file);

    res.status(201).json({
      message: "Upload berhasil",
      data: url,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const replacePhoto = async (req, res) => {
  try {
    const url = await replaceProductPhoto(Number(req.params.id), req.file);

    res.json({
      message: "Foto diganti",
      data: url,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    await deleteProductPhoto(Number(req.params.id));

    res.json({
      message: "Foto dihapus",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
