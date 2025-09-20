
import express, { Router, type Request, type Response } from "express";
import CommonServices from "../../services/common.service.js";
// import { getIssueTimeLineController } from "../../controllers/common.controller.js";

const CommonRoutes: Router = express.Router();


// CommonRoutes.post("/get-issue-time-line", getIssueTimeLineController);


CommonRoutes.get("/get-profile", async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        const profile = await CommonServices.getProfile(userId, role);

        if (!profile) {
            return res.status(404).json({
                status: false,
                message: "Profile not found",
                data: null
            })
        }

        return res.json({
            status: true,
            message: "Successfully fetched profile",
            data: profile
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something Went Wrong",
            data: null
        })
    }
})

CommonRoutes.post("/get-presigned-get-url", async (req: Request, res: Response) => {
    try {
        const {fileKey} = req.body;
        const userId = req.user.id;
        const role = req.user.role;
        
        console.log(fileKey);
        

        if (!fileKey) {
            return res.status(400).json({
                status: false,
                message: "Invalid Key",
                data: null
            })
        }

        const url = await CommonServices.getPresignedGetUrl(fileKey, role, userId);

        return res.json({
            status: true,
            data: {
                url: url
            },
            message: "Successfully generated presigned Url"
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something Went Wrong",
            data: null
        })
    }
})

CommonRoutes.post("/update-fcm-token", async (req: Request, res: Response) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        if (!fcmToken) {
            return res.status(400).json({
                status: false,
                message: "Invalid Device Token",
                data: null
            })
        }

        const response = await CommonServices.updateFcmToken(userId, role, fcmToken);

        if (!response) {
            return res.status(500).json({
                status: false,
                message: "Unable to update device token",
                data: null
            })
        }

        return res.json({
            status: true,
            message: "Successfully updated device token",
            data: null
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something Went Wrong",
            data: null
        })
    }
});


export default CommonRoutes;