import { type Request, type Response } from "express";
import CustomerServices from "../services/customer.service.js";
import isValidEnumValue from "../constants/constants.js";

export const getIssuesByStatusController = async (req: Request, res: Response) => {
    const status = req.params.status;
    if (!status || !['active', "closed"].includes(status)) {
        return res.status(400).json({
            status: false,
            message: "Invalid status",
            data: null
        })
    }
    try {
        let Issues;

        if (status == 'active') {
            Issues = await CustomerServices.fetchActiveIssues(req.user.id);
        }
        else {
            Issues = await CustomerServices.fetchClosedIssues(req.user.id)
        }

        res.send(Issues)
    } catch (error) {
        res.status(500).send()
    }
}

export const createIssueController = async (req: Request, res: Response) => {
    const { description, projectId } = req.body;
    console.log(req.body);
    console.log("issue creating");

    if ( !projectId || !description) {
        res.status(500).send({
            status: "failure",
            message: "Invalid data",
            data: {}
        })
    }

    try {
        const data = {
            description: description,
            projectId: projectId,
            customerId: req.user.id
        }
        const result = await CustomerServices.createIssue(data)
        res.send({
            status: "success",
            message: "Issue Created Successfully!",
            data: result.data
        })
    } catch (error) {
        console.log(error);
        res.send({
            status: "failure",
            message: "Error while creating issue!",
            data: {}
        })
    }
}

export const getProjectsList = async (req: Request, res: Response) => {
    
    try {
        const result = await CustomerServices.fetchProjectsList(req.user.id);
        if (result.status) {
            return res.json(result);
        }
        else {
            return res.status(400).json({
                status: false,
                data: null,
                message: "Invalid Request"
            })
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            data: null,
            message: "Internal Server Error"
        })
    }
}