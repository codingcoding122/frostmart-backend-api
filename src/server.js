import express from "express";
import dotenv from "dotenv";
import menuRoutes from "./modules/menu/menu.routes.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/menus", menuRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
