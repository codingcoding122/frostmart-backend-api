import * as transactionsService from "./transactions.service.js";
import { updateTransactionStatusSchema } from "./transactions.validation.js";

export const getTransactions = async (req, res) => {
  try {
    const data = await transactionsService.getAllTransactions();
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const data = await transactionsService.getMyTransactions(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await transactionsService.getTransactionById(id, req.user);
    res.json(data);
  } catch (error) {
    if (error.message === "Transaction not found") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({ message: error.message });
    }

    res.status(400).json({ message: error.message });
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { payment_status } = updateTransactionStatusSchema.parse(req.body);
    const data = await transactionsService.updateTransactionStatus(
      id,
      payment_status,
    );

    res.json(data);
  } catch (error) {
    if (error.message === "Transaction not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(400).json({ message: error.message });
  }
};
