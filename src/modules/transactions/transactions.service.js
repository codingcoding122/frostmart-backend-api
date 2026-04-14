import * as transactionsRepository from "./transactions.repository.js";

export const getAllTransactions = async () => {
  return await transactionsRepository.getTransactions();
};

export const getMyTransactions = async (userId) => {
  return await transactionsRepository.getTransactionsByUserId(userId);
};

export const getTransactionById = async (id, requester) => {
  const transaction = await transactionsRepository.getTransactionById(id);
  if (!transaction) throw new Error("Transaction not found");

  const isAdmin = requester.role === "admin";
  const isOwner = transaction.user_id === requester.id;

  if (!isAdmin && !isOwner) {
    throw new Error("Forbidden");
  }

  return transaction;
};

export const updateTransactionStatus = async (id, paymentStatus) => {
  const existing = await transactionsRepository.getTransactionById(id);
  if (!existing) throw new Error("Transaction not found");

  return await transactionsRepository.updateTransactionStatus(id, paymentStatus);
};
