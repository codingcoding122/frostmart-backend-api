import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";
import productRoutes from "./modules/product/product.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import transactionsRoutes from "./modules/transactions/transactions.routes.js";
import inventoryLogsRoutes from "./modules/inventory-logs/inventory-logs.routes.js";
import helmet from "helmet";
import { xss } from "express-xss-sanitizer";
import logger from "./middleware/logger.middleware.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

app.use(helmet());
app.use(xss());
app.use(logger);

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/inventory-logs", inventoryLogsRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
