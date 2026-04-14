import { db } from "../../config/db.config.js";
import * as inventoryRepository from "./inventory-logs.repository.js";
import { deleteCache } from "../../utils/cache.js";

const invalidateProductsCache = async () => {
  await deleteCache("cache:/api/products*");
};

export const adjustInventory = async (payload, actorId) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const product = await inventoryRepository.getProductForUpdate(
      client,
      payload.product_id,
    );

    if (!product) {
      throw new Error("Product not found");
    }

    let newStock = Number(product.stock);
    if (payload.change_type === "IN") {
      newStock += payload.quantity;
    } else {
      newStock -= payload.quantity;
      if (newStock < 0) {
        throw new Error("Stock cannot be negative");
      }
    }

    const updatedProduct = await inventoryRepository.updateStock(
      client,
      payload.product_id,
      newStock,
    );

    const log = await inventoryRepository.insertInventoryLog(
      client,
      payload.product_id,
      payload.change_type,
      payload.quantity,
      `${payload.description} (by user #${actorId})`,
    );

    await client.query("COMMIT");

    await invalidateProductsCache();

    return { product: updatedProduct, log };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getInventoryLogs = async (page, limit, productId) => {
  const logs = await inventoryRepository.getInventoryLogs(page, limit, productId);
  const totalData = await inventoryRepository.getInventoryLogsPages(limit, productId);

  return {
    page,
    limit,
    product_id: productId ?? null,
    total_pages: Number(totalData.total_pages),
    data: logs,
  };
};
