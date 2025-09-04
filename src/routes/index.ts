// src/routes/index.ts
import express from "express";
import authRoutes from "./auth/auth.routes.js";
import customerRoutes from "./customer/customer.routes.js";
import departmentRoutes from "./department/department.routes.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import CommonRoutes from "./common/common.routes.js";
import ManagerRoutes from "./manager/manager.routes.js";

const indexRouter = express.Router();

indexRouter.use("/auth", authRoutes);
indexRouter.use("/common", AuthMiddleware.AuthenticateUser, CommonRoutes);
indexRouter.use("/customers",AuthMiddleware.AuthenticateUser, AuthMiddleware.AuthorizeUsers(['CUSTOMER']), customerRoutes);
indexRouter.use("/departments",AuthMiddleware.AuthenticateUser, AuthMiddleware.AuthorizeUsers(['HEAD']), departmentRoutes);
indexRouter.use("/managers", AuthMiddleware.AuthenticateUser, AuthMiddleware.AuthorizeUsers(['ISSUE_MANAGER']) ,ManagerRoutes);

export default indexRouter;
