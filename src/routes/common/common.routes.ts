
import express from "express";
import { getIssueTimeLineController } from "../../controllers/common.controller.js";

const CommonRoutes = express.Router();


CommonRoutes.post("/get-issue-time-line", getIssueTimeLineController);


export default CommonRoutes;