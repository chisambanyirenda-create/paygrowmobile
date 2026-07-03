import { Router } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import salesRouter from "./sales";
import expensesRouter from "./expenses";
import dashboardRouter from "./dashboard";

const router = Router();

router.use("/", healthRouter);
router.use("/products", productsRouter);
router.use("/customers", customersRouter);
router.use("/suppliers", suppliersRouter);
router.use("/sales", salesRouter);
router.use("/expenses", expensesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
