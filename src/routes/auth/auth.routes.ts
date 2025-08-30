import { Router, type Request, type Response } from "express";



const AuthRouter: Router = Router();




AuthRouter.post("/get-otp", (req: Request<{}, {}, { mobile_number: number }>, res: Response) => {
    const { mobile_number } = req.body;
    if (!mobile_number) {
        return res.status(400).send()
    }
    
    try {
        
    } catch (error) {
        
    }
});

AuthRouter.post("/verify-token", (req: Request, res: Response) => {

})


export default AuthRouter;