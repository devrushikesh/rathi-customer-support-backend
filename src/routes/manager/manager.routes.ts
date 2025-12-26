import express, { Router, type Request, type Response } from "express";
import ManagerServices from "../../services/manager.service.js";
import type { InternalStatus } from "@prisma/client";

const ManagerRoutes: Router = express.Router();


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
    const { issueId, headId, initialDeadline } = req.body;
    if (!issueId || !headId || !initialDeadline) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {
        const result = await ManagerServices.assignIssueToDepartment(issueId, headId, req.user.id, initialDeadline);
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

ManagerRoutes.get("/get-issue-detail-by-id/:issueId", async (req: Request, res: Response) => {
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

ManagerRoutes.post("/mark-issue-invalid", async (req: Request, res: Response) => {
    const { issueId, reason } = req.body;
    console.log(issueId, reason);

    if (!issueId || !reason) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request"
        })
    }
    try {
        const result = await ManagerServices.markInvalidIssue(req.user.id, issueId, reason);
        console.log(result);

        return res.json(result);
    } catch (error) {
        console.log(error);

        return res.status(400).json({
            status: false,
            data: null,
            message: "Something wrong"
        })
    }
})

ManagerRoutes.get("/get-customers-list", async (req: Request, res: Response) => {
    try {
        const result = await ManagerServices.getCustomerList();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.get("/get-all-projects-list", async (req: Request, res: Response) => {
    try {
        const result = await ManagerServices.getAllProjectList();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.get("/get-manage-page-stats", async (req: Request, res: Response) => {
    try {
        const result = await ManagerServices.getManageStats();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.post("/create-customer", async (req: Request, res: Response) => {
    const { name, mobile_no, email } = req.body;

    if (!name || !mobile_no || !email || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{10}$/.test(mobile_no)) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request"
        })
    }
    try {
        const result = await ManagerServices.createCustomer(name, mobile_no, email);
        if (result.status) {
            return res.json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.post("/get-presigned-urls-for-project-attachments", async (req: Request, res: Response) => {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request: files array is required"
        });
    }

    try {
        const result = await ManagerServices.getPresignedUrlsForProjectAttachments(files);
        if (result.status) {
            return res.json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        });
    }
});

ManagerRoutes.post("/create-project", async (req: Request, res: Response) => {
    const { projectName, customerId, machineType, capacity, location, application, feedSize, finalProductSize, tempId } = req.body;

    if (!projectName || !customerId || !machineType || !capacity || !location || !application || !feedSize || !finalProductSize) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Invalid Request"
        })
    }
    try {
        const result = await ManagerServices.createProject(
            projectName, 
            customerId, 
            machineType, 
            capacity, 
            location, 
            application, 
            feedSize, 
            finalProductSize,
            tempId
        );
        if (result.status) {
            return res.json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});

ManagerRoutes.get(
    "/get-customer-details-by-id/:customerId",
    async (req: Request, res: Response) => {
        const { customerId } = req.params;

        console.log(customerId);
        

        // Validate: must be a number and a finite integer
        const numericId = Number(customerId);
        if (!Number.isInteger(numericId) || numericId <= 0) {
            console.log("Invalid customerId:", customerId);
            
            return res.status(400).json({
                status: false,
                data: null,
                message: "Invalid Request: customerId must be a positive integer",
            });
        }

        try {
            // Pass the numeric value to the service layer
            const result = await ManagerServices.getCustomerDetailsById(numericId);
            console.log(result);
            

            if (result.status) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: false,
                data: null,
                message: "Something went wrong",
            });
        }
    }
);

ManagerRoutes.get("/get-project-detail-by-id/:projectId", async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    if (!projectId) {
        return res.status(400).json({
            status: false,
            data: null,
            message: "Bad Request"
        })
    }
    try {

        const numericId = Number(projectId);

        const result = await ManagerServices.getProjectDetailById(numericId);
        if (result.status) {
            return res.json(result);
        }
        return res.status(400).json({
            status: false,
            data: null,
            message: "Failed to fetch project"
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Failed to fetch project"
        });
    }
});

ManagerRoutes.get("/get-home-page-stats", async (req: Request, res: Response) => {
    try {
        const result = await ManagerServices.getManagerHomeStats();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Something went wrong"
        })
    }
});


export default ManagerRoutes;