import { Router, type Request, type Response } from "express";



const AuthRouter: Router = Router();




AuthRouter.post("/login", (req: Request<{}, {}, { id: number }>, res: Response) => {

    try {
        
    } catch (error) {
        
    }
});

AuthRouter.post("/verify-token", (req: Request, res: Response) => {

})


export default AuthRouter;