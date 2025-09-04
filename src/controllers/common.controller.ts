// import type { Request, Response } from "express";
// import CommonServices from "../services/common.service.js";

// export const getIssueTimeLineController = async (req: Request, res: Response) => {
//     console.log("manager called timeline api");
    
//     try {
//         const { issueId } = req.body;
//         if (!issueId || !req.user.role) {
//             return {
//                 status: false,
//                 data: null,
//                 message: "Invalid Request"
//             }
//         }

//         let Issue;

//         if (req.user.role == "CUSTOMER") {
//             Issue = await CommonServices.fetchIssueTimelineForCustomer(issueId, req.user.id);
//         }
//         else if (req.user.role == "ISSUE_MANAGER") {
//             Issue = await CommonServices.fetchIssueTimelineForManager(issueId);
//         }
//         else {
//             Issue = await CommonServices.fetchIssueTimelineForHead(issueId, req.user.id);
//         }
//         console.log(Issue);
        
//         res.send(Issue)

//     } catch (error) {
//         res.status(500).send()
//     }
// }
