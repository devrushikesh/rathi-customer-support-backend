import { Router, type Request, type Response } from "express";
import AuthService from "../../services/auth.service.js";
import { getOtpAuthController, verifyOtpAuthController, verifyTokenAuthController } from "../../controllers/auth.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";



const AuthRouter: Router = Router();


AuthRouter.post("/get-otp", getOtpAuthController); 

AuthRouter.post("/verify-otp", verifyOtpAuthController);

AuthRouter.post("/verify-token", AuthMiddleware.AuthenticateUser, verifyTokenAuthController);

AuthRouter.post("/refresh-token", async (req: Request<{}, {}, { refreshToken: string }>, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            status: false,
            message: "Invalid Request",
            accessToken: null
        })
    }
    try {
        const result = await AuthService.getNewAccessToken(refreshToken);
        if (!result.status) {
            return res.status(401).json({
                status: false,
                message: result.message,
                accessToken: null
            })
        }

        return res.json({
            status: true,
            message: result.message,
            accessToken: result.accessToken
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            accessToken: null
        })
    }
});

AuthRouter.get("/logout", AuthMiddleware.AuthenticateUser, async (req: Request, res: Response) => {
    const result = await AuthService.logout(req.user.id);
    if (result.status) {
        return res.json(result);
    }else{
        return res.status(400).json(result)
    }
})

export default AuthRouter;