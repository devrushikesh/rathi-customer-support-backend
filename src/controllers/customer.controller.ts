import  { type Request, type Response } from "express";
import CustomerServices from "../services/customer.service.js";

export const getAllIssuesController = async (req: Request, res: Response) => {
    try {
        const Issues = await CustomerServices.fetchAllIssues(1);
        res.send(Issues)
    } catch (error) {
        res.status(500).send()
    }
}

export const getIssueTimeLineController = async (req: Request, res: Response) => {
    try {
        const issue_id:string = `${req.params.issue_id}`;
        if (!issue_id) {
            res.send("not found")
        }
        const Issue = await CustomerServices.fetchIssueTimeline(issue_id);
        res.send(Issue)
    } catch (error) {
        res.status(500).send()
    }
}

export const createIssueController = async (req: Request, res: Response) => {
    const { machine, description, priority, location, category } = req.body;
    if (!machine || !priority || !category  || !location || !description) {
        res.status(500).send({
            status: "failure",
            message: "Invalid data",
            data: {}
        })
    }
    try {
        const data = { 
            description: description, 
            machine: machine, 
            priority: priority, 
            location: location, 
            category: category, 
            customerId: 1 
        }
        await CustomerServices.createIssue(data)
        res.send({
            status: "success",
            message: "Issue Created Successfully!",
            data: data
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

