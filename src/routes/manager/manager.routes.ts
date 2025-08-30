import express, { type Request, type Response } from "express";
import ManagerServices from "../../services/manager.service.js";

const ManagerRoutes = express.Router();


ManagerRoutes.get("/get-new-issues", async (req: Request, res: Response) => {
    try {
        const issues = await ManagerServices.get_new_issues();
        res.send(issues)
    } catch (error) {
        res.status(500).send()
    }
})


ManagerRoutes.get("/get-issues/:status", async (req: Request, res: Response) => {
    const issue_status = req.params.status ?? "";
    if ([""].includes(issue_status)) {
        
    }
    try {
        const issues = await ManagerServices.get_all_issues();
        res.send(issues);
    } catch (error) {
        res.status(500).send()

    }
})

ManagerRoutes.post("/assign-new-issue", async (req: Request, res: Response) => {
    const { issue_id, assign_to } = req.body;
    if (!issue_id || !assign_to) {
        res.status(400).send("BAD REQUEST")
    }
    try {
        const assigned_issue = await ManagerServices.assign_issue(issue_id, assign_to, "emp_cuid_001");
        console.log(assigned_issue);

        res.send(assigned_issue)

    } catch (error) {
        res.status(500).send()
    }
})

export default ManagerRoutes;