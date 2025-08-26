import  { type Request, type Response } from "express";
import { createIssue, fetchAllIssues, fetchIssueTimeline } from "../services/customer.service.js";



export const getAllIssuesController = async (req: Request, res: Response) => {
    try {
        const Issues = await fetchAllIssues(4);
        res.send(Issues)
    } catch (error) {
        res.status(500).send()
    }
}


export const getIssueTimeLineController = async (req: Request, res: Response) => {
    try {
        const Issue = await fetchIssueTimeline(1);
        res.send(Issue)
    } catch (error) {
        res.status(500).send()
    }
}

export const createIssueController = async (req: Request, res: Response) => {
    const { machine, title, description, images, videos } = req.body;
    if (!machine || !title || !description) {
        res.status(500).send({
            status: "failure",
            message: "Invalid data",
            data: {}
        })
    }
    try {
        const data = { title: title, description: description, machine: machine, images: images, videos: videos, createdBy: 1 }
        await createIssue(data)
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

