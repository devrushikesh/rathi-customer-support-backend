import express, { type Request, type Response } from "express";
import { createIssueController, getAllIssuesController, getIssueTimeLineController } from "../../controllers/customer.controller.js";

const CustomerRoutes = express.Router();


CustomerRoutes.get("/get-all-issues", getAllIssuesController)

CustomerRoutes.get("/get-issue-timeline/:issue_id", getIssueTimeLineController)

CustomerRoutes.post("/create-issue", createIssueController)


export default CustomerRoutes;