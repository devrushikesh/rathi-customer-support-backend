import express, { type Request, type Response } from "express";

const CustomerRoutes = express.Router();


CustomerRoutes.post("/create-issue", (req: Request, res: Response) => {
    const { machine, title, description  } = req.body;
    try {
        
    } catch (error) {
        
    }
})



export default CustomerRoutes;