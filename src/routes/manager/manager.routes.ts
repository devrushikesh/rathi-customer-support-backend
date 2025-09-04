import express, { type Request, type Response } from "express";
import ManagerServices from "../../services/manager.service.js";
import type { InternalStatus } from "@prisma/client";

const ManagerRoutes = express.Router();


ManagerRoutes.get("/get-new-issues", async (req: Request, res: Response) => {
    try {
        const issues = await ManagerServices.getNewIssues();
        return res.json(issues)
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.get("/get-issues-by-status/:status", async (req: Request, res: Response) => {
    const status = req.params.status;
    if (!status || !['ALL', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED', 'CLOSED'].includes(status)) {
        return res.json({
            status: false,
            data: null,
            message: "Invalid status!"
        })
    }
    try {
        let issues;
        if (status == "ALL") {
            issues = await ManagerServices.getAllIssuesExcludeNew();
        }
        else {
            issues = await ManagerServices.getIssuesByStatus(status as InternalStatus);
        }
        return res.json(issues);
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            message: "Internal Server error.."
        })
    }
});


ManagerRoutes.get("/get-department-head-list", async (req: Request, res: Response) => {
    try {
        const result = await ManagerServices.getHeadList()
        console.log(result);

        return res.json(result);
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            message: "Internal Server error"
        })
    }
});

ManagerRoutes.post("/assign-issue-to-department", async (req: Request, res: Response) => {
    const { issueId, headId } = req.body;
    if (!issueId || !headId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {
        const result = await ManagerServices.assignIssueToDepartment(issueId, headId, req.user.id);
        if (result.status) {
            return res.json(result)
        }
        else {
            return res.status(400).json(result)
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: error
        });
    }
})




ManagerRoutes.get("/get-project-detail-by-id/:issueId", async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    if (!issueId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {
        const result = await ManagerServices.getIssueById(issueId, req.user.id);
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



export default ManagerRoutes;