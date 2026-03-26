import express from "express";
import dotenv from "dotenv";
import menuRoutes from "./modules/menu/menu.routes.js";
import helmet from "helmet";
import { xss } from "express-xss-sanitizer";
import logger from "./middleware/logger.middleware.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(logger);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/menus", menuRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
