import express, { type Request, type Response } from "express";
import DepartmentService from "../../services/department.service.js";
import { VisitStatus } from "@prisma/client";

const DepartmentRoutes = express.Router();



DepartmentRoutes.post("/add-comment-to-issue", async (req: Request, res: Response) => {
  const {issueId, comment, isVisibleToCustomer} = req.body;
  if (!issueId || !comment || typeof isVisibleToCustomer != 'boolean') {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid Request"
    })
  }
  try {
    const result = await DepartmentService.makeCommentInIssue(req.user.id, issueId, comment, isVisibleToCustomer);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Something wrong"
    })
  }
})


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

  if (!issueId || issueId == undefined || req.user.department == 'SERVICE') {
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


DepartmentRoutes.get("/get-site-visits-list-by-status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;

      // validate status
      if (!status || !Object.values(VisitStatus).includes(status as VisitStatus)) {
        return res.status(400).json({
          status: false,
          data: null,
          message: "Invalid status provided",
        });
      }

      const response = await DepartmentService.getSiteVisistsListByStatus(
        status as VisitStatus
      );

      return res.status(response.status ? 200 : 500).json(response);
    } catch (error: any) {
      console.error("Error fetching site visits:", error);
      return res.status(500).json({
        status: false,
        data: null,
        message: "Internal server error while fetching site visits",
        error: error.message,
      });
    }
  }
);

/**
 * Route: Reject Site Visit Request
 * ----------------------------------
 * This API is used by Service Head (or relevant department head)
 * to reject a pending site visit request.
 *
 * Expected body:
 * {
 *   "siteVisitRequestId": "req_456"     // ID of the site visit request
 * }
 */
DepartmentRoutes.post("/reject-site-visit-request", async (req: Request, res: Response) => {
  try {
    const { siteVisitRequestId } = req.body;

    if (!siteVisitRequestId) {
      return res.status(400).json({
        status: false,
        message: "employeeId and siteVisitRequestId are required",
        data: null,
      });
    }

    const result = await DepartmentService.rejectSiteVisitRequest(
      req.user.id,
      siteVisitRequestId
    );

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error /reject-site-visit-request:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
});


/**
 * API: Get Service Engineers List
 * ----------------------------------------
 * Used by Service Head / Other Departments
 * to fetch available Service Engineers for
 * assigning site visits.
 */
DepartmentRoutes.get("/get-service-engineers-list", async (req: Request, res: Response) => {
  if (req.user.department != 'SERVICE') {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid Request"
    });
  }
  try {

    const result = await DepartmentService.getServiceEngineersList();

    if (!result.status) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error in /get-service-engineers:", error);
    return res.status(500).json({
      status: false,
      data: null,
      message: "Internal server error while fetching service engineers"
    });
  }
});


// This route is only used for Service head
DepartmentRoutes.get("/get-requests-list", async (req: Request, res: Response) => {
  if (req.user.department != 'SERVICE') {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid request"
    })
  }
  const result = await DepartmentService.getSiteVisitRequestsList();
  return res.json(result);
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

DepartmentRoutes.post("/create-other-department-site-visit", async (req: Request, res: Response) => {
  try {
    const { issueId, visitorId, siteVisitRequestId, scheduledDate } = req.body;

    if (req.user.department != "SERVICE") {
      console.log(req.user.department);
      return res.status(400).json({
        status: false,
        data: null,
        message: "Invalid Request",
      });
    }

    // Basic validation
    if (!issueId || !visitorId || !siteVisitRequestId || !scheduledDate) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Missing required fields: employeeId, issueId, visitorId, siteVisitRequestId, scheduledDate"
      });
    }

    const scheduledDateObj = new Date(scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Invalid scheduledDate format"
      });
    }

    console.log(scheduledDateObj);
    
    // Call the service function
    const result = await DepartmentService.createSiteVisitScheduleForOtherDepartments(
      req.user.id,
      issueId,
      visitorId,
      siteVisitRequestId,
      scheduledDateObj
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }


  } catch (error) {
    console.error("Error in /create-site-visit-schedule:", error);
    return res.status(500).json({
      status: false,
      data: null,
      message: "Internal server error"
    });
  }
});

DepartmentRoutes.post("/create-own-department-site-visit", async (req: Request, res: Response) => {
  try {
    const { issueId, visitorId, scheduledDate } = req.body;

    if (req.user.department != "SERVICE") {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Invalid Request",
      });
    }

    // Validate required fields
    if (!issueId || !visitorId || !scheduledDate) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Missing required fields: employeeId, issueId, visitorId, scheduledDate",
      });
    }

    // Validate scheduledDate
    const scheduledDateObj = new Date(scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Invalid scheduledDate format",
      });
    }

    // Call the service function
    const result = await DepartmentService.createSiteVisitScheduleForServiceDepartments(
      req.user.id,
      issueId,
      visitorId,
      scheduledDateObj
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in /create-service-department-site-visit:", error);
    return res.status(500).json({
      status: false,
      data: null,
      message: "Internal server error",
    });
  }
});


export default DepartmentRoutes;