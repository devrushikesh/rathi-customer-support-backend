import express, { response, Router, type Request, type Response } from "express";
import DepartmentService from "../../services/department.service.js";
import { VisitStatus } from "@prisma/client";

const DepartmentRoutes: Router = express.Router();



DepartmentRoutes.post("/add-comment-to-issue", async (req: Request, res: Response) => {
  const { issueId, comment, isVisibleToCustomer } = req.body;
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


DepartmentRoutes.post("/complete-scheduled-site-visit/:siteVisitId", async (req: Request, res: Response) => {
  const headId = req.user?.id; // assuming `req.user` is populated by auth middleware
  const siteVisitId = req.params.siteVisitId;

  if (!headId || !siteVisitId) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid Request"
    });
  }

  try {
    const result = await DepartmentService.completeScheduledSiteVisit(headId, siteVisitId);

    if (result.status) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error completing site visit:", error);
    return res.json({
      status: false,
      data: null,
      message: "Something went wrong"
    });
  }
})


DepartmentRoutes.post("/cancel-scheduled-site-visit/:siteVisitId", async (req: Request, res: Response) => {
  const headId = req.user?.id; // from auth middleware
  const siteVisitId = req.params.siteVisitId;
  const { remark } = req.body;

  if (!headId || !siteVisitId) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid Request"
    });
  }

  try {
    const result = await DepartmentService.cancelScheduledSiteVisit(headId, siteVisitId, remark);

    if (result.status) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error cancelling site visit:", error);
    return res.json({
      status: false,
      data: null,
      message: "Something went wrong"
    });
  }
})


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

DepartmentRoutes.post("/mark-issue-resolved", async (req: Request, res: Response) => {
  try {
    const { issueId, remark } = req.body;

    // 1. Input validation
    if (!issueId) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Missing required fields: headId and issueId",
      });
    }

    // 2. Call service
    const result = await DepartmentService.markResolveIssue(req.user.id, issueId, remark);

    // 3. Respond with success
    return res.status(200).json({
      status: true,
      message: "Issue marked as resolved successfully",
      data: null, // updated issue + timelines (so frontend can refresh directly)
    });
  } catch (error: any) {
    console.error("Error in /mark-issue-resolved:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Failed to resolve issue",
      data: null
    });
  }
});

DepartmentRoutes.post("/add-site-engineer", async (req: Request, res: Response) => {
  const { mobile_no, email, name, location } = req.body;

  if (req.user.department != 'SERVICE') {
    return res.status(400).json({
      status: false,
      message: "Permission Denied"
    });
  }

  // --- Validation ---
  // Name at least 3 chars
  if (!name || name.trim().length < 3) {
    return res.status(400).json({
      status: false,
      message: "Name must be at least 3 characters long"
    });
  }

  // Location at least 3 chars
  if (!location || location.trim().length < 3) {
    return res.status(400).json({
      status: false,
      message: "Location must be at least 3 characters long"
    });
  }

  // Indian mobile number: starts with 6-9 and total 10 digits
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!mobile_no || !indianMobileRegex.test(mobile_no)) {
    return res.status(400).json({
      status: false,
      message: "Invalid Indian mobile number"
    });
  }

  // Email is optional, but if provided it must be valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: false,
      message: "Invalid email format"
    });
  }
  // --- End validation ---

  try {
    const response = await DepartmentService.addServiceEngineer(
      name.trim(),
      mobile_no.trim(),
      email.trim(),
      location.trim()
    );
    return res.json({
      status: true,
      data: response,
      message: "Successfully created the Member"
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      status: false,
      data: null,
      message: "Something went wrong"
    });
  }
});


DepartmentRoutes.get("/get-service-head-team-stat", async (req: Request, res: Response) => {
  try {
    if (req.user.department != 'SERVICE') {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Permission denied"
      })
    }

    const result = await DepartmentService.getTeamPageStats();

    return res.json({
      status: true,
      data: result,
      message: "Successfully Fetched the stats of team page"
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      data: null,
      message: "Failed to Fetched the stats of team page"
    })
  }
})

DepartmentRoutes.get("/get-upcoming-site-visit-schedules/:visitorId", async (req: Request, res: Response) => {
  const siteEngId = req.params.visitorId;
  if (!siteEngId || siteEngId == undefined || req.user.department != 'SERVICE') {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid request"
    })
  }
  try {
    const result = await DepartmentService.getUpcomingSiteVisitSchedules(siteEngId);
    return res.json({
      status: true,
      data: result,
      message: "Successfully fetched upcoming schedules"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      data: null,
      message: "Failed to fetch upcoming schedules"
    })
  }
})


DepartmentRoutes.post("/update-site-engineer-profile", async (req: Request, res: Response) => {
  const { id, name, email, mobile_no, location, isActive } = req.body;

  if (req.user.department != 'SERVICE') {
    return res.status(400).json({
      status: false,
      message: "Permission Denied"
    });
  }

  // --- Validation ---
  if (!id) {
    return res.status(400).json({
      status: false,
      message: "Invalid Request"
    });
  }

  // Name at least 3 chars
  if (name && name.trim().length < 3) {
    return res.status(400).json({
      status: false,
      message: "Name must be at least 3 characters long"
    });
  }

  // Location at least 3 chars
  if (location && location.trim().length < 3) {
    return res.status(400).json({
      status: false,
      message: "Location must be at least 3 characters long"
    });
  }

  // Indian mobile number: starts with 6-9 and total 10 digits
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (mobile_no && !indianMobileRegex.test(mobile_no)) {
    return res.status(400).json({
      status: false,
      message: "Invalid Indian mobile number"
    });
  }

  // Email is optional, but if provided it must be valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({
      status: false,
      message: "Invalid email format"
    });
  }
  // --- End validation ---

  try {
    const response = await DepartmentService.updateServiceEngineer(
      id,
      name?.trim(),
      mobile_no?.trim(),
      email?.trim(),
      location?.trim(),
      isActive
    );
    return res.json({
      status: true,
      data: response,
      message: "Successfully updated the Member"
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      status: false,
      data: null,
      message: "Something went wrong"
    });
  }
});


DepartmentRoutes.post("/request-attachment-for-issue", async (req: Request, res: Response) => {
  const { issueId, remark } = req.body;
  if (!issueId || !remark) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Invalid Request"
    })
  }
  try {
    const result = await DepartmentService.requestAttachmentForIssue(req.user.id, issueId, remark);
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


DepartmentRoutes.get("/get-home-page-stats", async (req: Request, res: Response) => {
  try {
    const result = await DepartmentService.getHomePageStats(req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      status: false,
      data: null,
      message: "Something went wrong"
    })
  }
})


export default DepartmentRoutes;