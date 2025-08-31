import express, { type Request, type Response } from "express";
import { createIssueController, getIssuesByStatusController } from "../../controllers/customer.controller.js";

const CustomerRoutes = express.Router();


CustomerRoutes.get("/get-all-issues/:status", getIssuesByStatusController)


CustomerRoutes.post("/create-issue", createIssueController)


export default CustomerRoutes;