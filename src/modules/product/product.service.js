import { deleteImage, uploadImage } from "../../utils/cloudinary.js";
import * as productRepository from "./product.repository.js";
import { deleteCache } from "../../utils/cache.js";
import { redisClient } from "../../config/redis.config.js";

const invalidateProductsCache = async () => {
  await deleteCache("cache:/api/products*");
};

export const createProduct = async (data) => {
  await invalidateProductsCache();
  return await productRepository.createProduct(data);
};

export const updateProduct = async (id, data) => {
  const existing = await productRepository.getProductById(id);
  if (!existing) {
    throw new Error("Product is not found!");
  }
  await invalidateProductsCache();
  return await productRepository.updateProduct(id, data);
};

export const getProductById = async (id) => {
  const product = await productRepository.getProductById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  const imageMeta = await redisClient.get(`product:image:${id}`);
  if (imageMeta) {
    product.image = JSON.parse(imageMeta);
  }

  return product;
};

export const getProductsWithPagination = async (page, limit, search = "") => {
  const products = await productRepository.getProducts(page, limit, search);

  const totalData = await productRepository.getPages(limit, search);
  return {
    page,
    limit,
    search,
    total_pages: Number(totalData.total_pages),
    data: products,
  };
};

export const deleteProduct = async (id) => {
  const existing = await productRepository.getProductById(id);
  if (!existing) {
    throw new Error("Product not found");
  }

  await productRepository.deleteProduct(id);
  await invalidateProductsCache();
};

export const uploadProductPhoto = async (id, file) => {
  if (!file) {
    throw new Error("File tidak ditemukan");
  }
  const product = await getProductById(id);
  if (!product) throw new Error("Product tidak ditemukan");

  const result = await uploadImage(file.buffer);
  await redisClient.set(
    `product:image:${id}`,
    JSON.stringify({
      url: result.secure_url,
      public_id: result.public_id,
    }),
    { EX: 60 * 60 * 24 * 30 },
  );

  // INVALIDATE CACHE
  await invalidateProductsCache();

  return result.secure_url;
};

export const replaceProductPhoto = async (id, file) => {
  if (!file) {
    throw new Error("File tidak ditemukan");
  }

  await getProductById(id);
  const existingImage = await redisClient.get(`product:image:${id}`);
  if (existingImage) {
    const { public_id: oldPublicId } = JSON.parse(existingImage);
    await deleteImage(oldPublicId);
  }

  // Upload foto baru
  const result = await uploadImage(file.buffer);
  await redisClient.set(
    `product:image:${id}`,
    JSON.stringify({
      url: result.secure_url,
      public_id: result.public_id,
    }),
    { EX: 60 * 60 * 24 * 30 },
  );

  // INVALIDATE CACHE
  await invalidateProductsCache();
  return result.secure_url;
};

export const deleteProductPhoto = async (id) => {
  await getProductById(id);
  const existingImage = await redisClient.get(`product:image:${id}`);
  if (!existingImage) {
    throw new Error("Foto tidak ditemukan");
  }

  const { public_id: publicId } = JSON.parse(existingImage);

  await deleteImage(publicId);
  await redisClient.del(`product:image:${id}`);

  // INVALIDATE CACHE
  await invalidateProductsCache();
};
