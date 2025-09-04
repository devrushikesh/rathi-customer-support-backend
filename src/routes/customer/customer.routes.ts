import express, { type Request, type Response } from "express";
import { createIssueController, getIssuesByStatusController, getProjectsList } from "../../controllers/customer.controller.js";
import CustomerServices from "../../services/customer.service.js";

const CustomerRoutes = express.Router();


CustomerRoutes.get("/get-all-issues/:status", getIssuesByStatusController);

CustomerRoutes.post("/create-issue", createIssueController);

CustomerRoutes.get("/get-projects-list", getProjectsList);

CustomerRoutes.get("/get-project-detail-by-id/:issueId", async (req: Request, res: Response) => {
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