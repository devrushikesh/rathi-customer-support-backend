import { Router, type Request, type Response } from "express";
import AuthService from "../../services/auth.service.js";
import { getOtpAuthController, verifyOtpAuthController, verifyTokenAuthController } from "../../controllers/auth.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";



const AuthRouter: Router = Router();


AuthRouter.post("/get-otp", getOtpAuthController);

AuthRouter.post("/verify-otp", verifyOtpAuthController);

AuthRouter.post("/verify-token", AuthMiddleware.AuthenticateUser, verifyTokenAuthController);


export default AuthRouter;