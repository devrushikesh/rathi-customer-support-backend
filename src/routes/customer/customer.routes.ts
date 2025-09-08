import express, { type Request, type Response } from "express";
import { createIssueController, getIssuesByStatusController, getProjectsList } from "../../controllers/customer.controller.js";
import CustomerServices from "../../services/customer.service.js";

const CustomerRoutes = express.Router();


CustomerRoutes.get("/get-all-issues/:status", getIssuesByStatusController);

CustomerRoutes.post("/create-issue", createIssueController);

CustomerRoutes.get("/get-projects-list", getProjectsList);

CustomerRoutes.post("/get-project-detail-by-id", async (req: Request, res: Response) => {
    const { projectId } = req.body;

    if (!projectId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request",
        });
    }

    try {
        const result = await CustomerServices.getProjectById(
            Number(projectId),
            req.user.id // assuming `req.user.id` is your customerId
        );

        if (!result.status) {
            return res.status(404).json(result); // project not found or failed
        }

        return res.status(200).json(result); // success
    } catch (error: any) {
        console.error("Error in /get-project-detail-by-id:", error);
        return res.status(500).json({
            status: false,
            data: null,
            message: error.message || "Internal Server Error",
        });
    }
});


CustomerRoutes.get("/get-issue-detail-by-id/:issueId", async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    if (!issueId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {
        const result = await CustomerServices.getIssueById(issueId, req.user.id);
        if (result.status) {
            return res.json(result);
        }
        return res.status(400).json({
            status: false,
            data: null,
            message: "Failed to fetch issue"
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Failed to fetch issue"
        });
    }
})

export default CustomerRoutes;