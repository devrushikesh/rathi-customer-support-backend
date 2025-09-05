import express, { type Request, type Response } from "express";
import DepartmentService from "../../services/department.service.js";

const DepartmentRoutes = express.Router();


DepartmentRoutes.get("/get-issues-by-status/:status", async (req: Request, res: Response) => {
    console.log("called");


    const status = req.params.status
    const headId = req.user.id;
    if (!headId || !status || !['NEW', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
        // console.log(status);

        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request"
        })
    }
    try {

        let result;
        if (status == 'NEW') {
            result = await DepartmentService.getNewAssignedIssues(headId);
        }
        else if (status == 'IN_PROGRESS') {
            result = await DepartmentService.getInProgressIssues(headId);
        }
        else {
            result = await DepartmentService.getClosedIssues(headId);
        }

        console.log(result);

        if (result.status) {
            return res.json(result);
        }
        else {
            return res.status(400).json(result)
        }
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            message: "Something went wrong"
        });
    }
})


DepartmentRoutes.post("/start-working", async (req: Request, res: Response) => {
    const { issueId } = req.body;
    if (!issueId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid request"
        })
    }
    try {
        const result = await DepartmentService.startWorking(req.user.id, issueId);
        if (result.status) {
            return res.json(result);
        }
        else {
            return res.status(400).json(result)
        }
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            message: "Something went wrong"
        });
    }
})


// This route is used for to create the request for site visit to the service head
DepartmentRoutes.post("/request-site-visit", async (req: Request, res: Response) => {
    const { issueId } = req.body;

    if (!issueId || req.user.department == 'SERVICE') {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        });
    }

    try {
        const result = await DepartmentService.requestSiteVisitToServiceHead(req.user.id, issueId);
        if (result.status) {
            return res.json(result);
        }
        else {
            return res.status(400).json({
                status: false,
                data: null,
                message: "Bad Request"
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Bad Request"
        });
    }
})

// This route is only used for Service head
DepartmentRoutes.post("/get-requests-list", (req: Request, res: Response) => {

})



DepartmentRoutes.get("/get-project-detail-by-id/:issueId", async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    if (!issueId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {
        const result = await DepartmentService.getIssueById(issueId, req.user.id);
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



export default DepartmentRoutes;