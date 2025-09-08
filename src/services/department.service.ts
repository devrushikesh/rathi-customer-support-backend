import type { InternalStatus, VisitStatus } from "@prisma/client";
import prisma from "../prisma/client.js";


/**
 * DepartmentService handles all business logic related to issues,
 * site visit requests, scheduling, comments, and status updates
 * for department heads and service engineers.
 */


class DepartmentService {


    /**
     * Fetch all issues newly assigned to a head where work has not yet started.
     * @param employeeId - Head employee ID
     * @returns List of assigned issues with status NEW
     */
    static async getNewAssignedIssues(employeeId: string) {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    assignedDepartments: {
                        some: {
                            employeeId: employeeId,
                            isActive: true,
                            isStartedWork: false
                        }
                    }
                },
                select: {
                    id: true,
                    internalStatus: true,
                    customerStatus: true,
                    projectId: true,
                    ticketNo: true,
                    description: true,
                    updatedAt: true,
                    createdAt: true,
                    isAttachmentsRequested: true,
                    isSiteVisitRequested: true,
                    latestStatus: {
                        select: {
                            action: true,
                        },
                    },
                },
            })
            return {
                status: true,
                data: issues,
                message: "Fetched New Assigned Issues"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Something went wrong"
            }
        }
    }

    /**
     * Fetch all issues in progress (work started but not closed).
     * @param employeeId - Head employee ID
     * @returns List of issues currently in progress
     */
    static async getInProgressIssues(employeeId: string) {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    NOT: {
                        internalStatus: 'CLOSED'
                    },
                    assignedDepartments: {
                        some: {
                            employeeId: employeeId,
                            isActive: true,
                            isStartedWork: true
                        }
                    }
                },
                select: {
                    id: true,
                    internalStatus: true,
                    customerStatus: true,
                    projectId: true,
                    ticketNo: true,
                    description: true,
                    updatedAt: true,
                    createdAt: true,
                    isAttachmentsRequested: true,
                    isSiteVisitRequested: true,
                    latestStatus: {
                        select: {
                            action: true,
                        },
                    },
                },
            })
            return {
                status: true,
                data: issues,
                message: "Fetched In progress Issues"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Something went wrong"
            }
        }
    }

    /**
     * Fetch all closed issues assigned to a head.
     * @param employeeId - Head employee ID
     * @returns List of closed issues
     */
    static async getClosedIssues(employeeId: string) {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    internalStatus: 'CLOSED',
                    assignedDepartments: {
                        some: {
                            employeeId: employeeId,
                            isActive: false,
                            isStartedWork: true
                        }
                    }
                }
            })
            return {
                status: true,
                data: issues,
                message: "Fetched Closed Issues"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Something went wrong"
            }
        }
    }


    /**
     * Fetch a specific issue by ID with validation that
     * the head has access to it.
     * Includes customer, timeline, and project details.
     * @param issueId - Issue ID
     * @param headId - Head employee ID
     * @returns Issue details if valid, else error
     */
    static async getIssueById(issueId: string, headId: string) {
        try {
            const issueAssigned = await prisma.issue.findFirst({
                where: {
                    assignedDepartments: {
                        some: {
                            issueId: issueId,
                            employeeId: headId
                        }
                    }
                }
            })

            if (!issueAssigned) {
                throw new Error("Invalid Request");
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile_no: true
                        }
                    },
                    timeline: {
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    project: {

                        select: {
                            projectName: true,
                            machineType: true,
                            capacity: true,
                            location: true,
                            createdAt: true
                        }
                    }
                }
            });

            if (!issue) {
                return {
                    status: false,
                    data: null,
                    message: "Issue not found or access denied"
                };
            }

            return {
                status: true,
                data: issue,
                message: `Issue ${issue.ticketNo} retrieved successfully`
            };

        } catch (error) {
            console.error("Failed to fetch issue:", error);
            return {
                status: false,
                data: null,
                message: "Failed to fetch issue"
            };
        }
    }

    /**
     * Fetch issues assigned to a head filtered by internal status.
     * @param employeeId - Head employee ID
     * @param status - InternalStatus enum
     * @returns List of issues matching status
     */
    static async getIssuesByStatus(employeeId: string, status: InternalStatus) {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    internalStatus: status,
                    assignedDepartments: {
                        some: {
                            employeeId: employeeId,
                            isActive: true,
                            isStartedWork: true
                        }
                    }
                },
                select: {
                    id: true,
                    internalStatus: true,
                    customerStatus: true,
                    projectId: true,
                    ticketNo: true,
                    description: true,
                    updatedAt: true,
                    createdAt: true,
                    isAttachmentsRequested: true,
                    isSiteVisitRequested: true,
                    latestStatus: {
                        select: {
                            action: true,
                        },
                    },
                },
            })
            return {
                status: true,
                data: issues,
                message: "Fetched New Assigned Issues"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Something went wrong"
            }
        }
    }


    /**
     * Mark an issue as "work started" by the assigned head.
     * Updates issueAssignedDepartment and issue timeline.
     * @param employeeId - Head employee ID
     * @param issueId - Issue ID
     * @returns Updated issue with new status
     */
    static async startWorking(employeeId: string, issueId: string) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const issueAssigned = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        employeeId,
                        issueId,
                        isActive: true,
                        isStartedWork: false
                    }
                });

                if (!issueAssigned) {
                    throw new Error("This issue is not assigned to this head");
                }

                await tx.issueAssignedDepartment.update({
                    where: { id: issueAssigned.id }, // ✅ only use unique field
                    data: { isStartedWork: true }
                });

                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId,
                        action: 'WORK_STARTED',
                        fromCustomerStatus: "OPEN",
                        toCustomerStatus: "IN_PROGRESS",
                        fromInternalStatus: "OPEN",
                        toInternalStatus: "IN_PROGRESS",
                        comment: "Issue taken up for processing",
                        visibleToCustomer: true
                    }
                });

                const issue = await tx.issue.update({
                    where: { id: issueId },
                    data: {
                        customerStatus: "IN_PROGRESS",
                        internalStatus: "IN_PROGRESS",
                        latestStatusId: latestIssueTimeLineEntry.id
                    }
                });

                return issue;
            });

            return {
                status: true,
                message: "Status Updated",
                data: result
            };
        } catch (error: any) {
            console.error("startWorking error:", error);
            return {
                status: false,
                message: error.message || "Something went Wrong",
                data: null
            };
        }
    }


    /**
     * Request a site visit from Service Head by a department head.
     * Validates assignment, prevents duplicate requests,
     * logs timeline, and updates issue flags.
     * @param employeeId - Head employee ID
     * @param issueId - Issue ID
     * @returns Success or failure response
     */
    static async requestSiteVisitToServiceHead(employeeId: string, issueId: string) {
        try {
            const assignment = await prisma.issueAssignedDepartment.findFirst({
                where: {
                    employeeId,
                    issueId,
                    isActive: true,
                    employee: { isActive: true }
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            department: true
                        }
                    },
                    issue: {
                        select: {
                            ticketNo: true
                        }
                    }
                }
            });

            if (!assignment || !assignment.employee?.department) {
                return { status: false, data: null, message: "Employee not found or not assigned" };
            }

            const siteVisitRequest = await prisma.siteVisitRequest.findFirst({
                where: {
                    issueId: issueId,
                    status: 'PENDING'
                }
            })

            if (siteVisitRequest) {
                return { status: false, data: null, message: "Already Request Submitted" };
            }

            await prisma.$transaction(async (tx) => {
                // 1. Create site visit request
                await tx.siteVisitRequest.create({
                    data: {
                        issueId,
                        requestFromHeadId: employeeId,
                        requestFromName: assignment.employee.name,
                        requestFromDepartment: assignment.employee.department!,
                        ticketNo: assignment.issue.ticketNo,
                        status: 'PENDING'
                    }
                });

                // 2. Add timeline record
                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId,
                        action: 'SITE_VISIT_REQUESTED',
                        comment: "Site visit scheduling requested; awaiting Service Head assignment."
                    }
                });

                // 3. Update issue status
                await tx.issue.update({
                    where: { id: issueId },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitRequested: true
                    }
                });
            });

            return {
                status: true,
                data: null,
                message: "Site visit requested successfully"
            };
        } catch (error) {
            console.error("Error in needSiteVisitRequest:", error);
            return {
                status: false,
                data: null,
                message: "Failed to request site visit"
            };
        }
    }


    /**
     * Reject a pending site visit request.
     * Only works if request status = PENDING.
     * Logs timeline entry for audit.
     * @param employeeId - Head employee ID
     * @param siteVisitRequestId - Site Visit Request ID
     * @returns Updated request with rejection
     */
    static async rejectSiteVisitRequest(employeeId: string, siteVisitRequestId: string) {
        try {
            // 1. Find the request
            const siteVisitRequest = await prisma.siteVisitRequest.findUnique({
                where: { id: siteVisitRequestId }
            });

            if (!siteVisitRequest || siteVisitRequest.status !== "PENDING") {
                return {
                    status: false,
                    data: null,
                    message: "Invalid or already processed site visit request"
                };
            }

            // 2. Perform rejection inside a transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update site visit request
                const updatedRequest = await tx.siteVisitRequest.update({
                    where: { id: siteVisitRequestId },
                    data: {
                        status: "REJECTED",
                    }
                });

                // Add rejection to issue timeline (audit trail)
                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId: siteVisitRequest.issueId,
                        action: "SITE_VISIT_REQUEST_REJECTED",
                        visibleToCustomer: false,
                        comment: `Site visit request rejected by Service Head.`
                    }
                });

                await tx.issue.update({
                    where: {
                        id: updatedRequest.issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitRequested: false
                    }
                })

                return updatedRequest;
            });

            return {
                status: true,
                data: result,
                message: "Site visit request rejected successfully"
            };

        } catch (error) {
            console.error("Error rejecting site visit request:", error);
            return {
                status: false,
                data: null,
                message: "Failed to reject site visit request"
            };
        }
    }


    /**
     * Add a comment in an issue by an assigned head.
     * Ensures employee is still assigned and active.
     * Updates timeline and latest status.
     * @param employeeId - Head employee ID
     * @param issueId - Issue ID
     * @param comment - Comment text
     * @returns Success or failure response
     */

    static async makeCommentInIssue(employeeId: string, issueId: string, comment: string, isVisibleToCustomer: boolean) {
        const transaction = await prisma.$transaction(async (tx) => {
            // Verify employee is assigned to this issue
            const assignment = await tx.issueAssignedDepartment.findFirst({
                where: {
                    issueId,
                    employeeId,
                    isActive: true,
                    employee: { isActive: true }
                },
                include: {
                    employee: {
                        select: { id: true, name: true, department: true }
                    }
                }
            });

            if (!assignment) {
                throw new Error("Employee is not assigned to this issue");
            }

            // Create a new issue timeline entry
            const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                data: {
                    issueId,
                    action: "COMMENT_ADDED",
                    comment,
                    visibleToCustomer: isVisibleToCustomer,
                    performedBy: employeeId,
                }
            });

            // Update the issue with the latest status
            await tx.issue.update({
                where: {
                    id: issueId
                },
                data: {
                    latestStatusId: latestIssueTimeLineEntry.id
                }
            });

            return {
                status: true,
                data: null,
                message: "Comment added successfully"
            };
        });

        return transaction;
    }


    /**
     * Schedule a site visit for issues requested by
     * other departments (not SERVICE).
     * Validates request, assigns service engineer,
     * logs timeline, and closes the request.
     * @param employeeId - Head employee ID
     * @param issueId - Issue ID
     * @param visitorId - Service engineer ID
     * @param siteVisitRequestId - Request ID
     * @param scheduledDate - Scheduled Date
     * @returns Success or failure response
     */
    static async createSiteVisitScheduleForOtherDepartments(employeeId: string, issueId: string, visitorId: string, siteVisitRequestId: string, scheduledDate: Date) {
        try {
            const siteVisitRequest = await prisma.siteVisitRequest.findUnique({
                where: {
                    id: siteVisitRequestId,
                    issueId: issueId,
                    status: 'PENDING'
                }
            })

            if (!siteVisitRequest || siteVisitRequest.status != "PENDING" || !siteVisitRequest.requestFromDepartment) {
                return {
                    status: false,
                    data: null,
                    message: "Invalid site visit request"
                };
            }

            const visitor = await prisma.employee.findUnique({
                where: {
                    id: visitorId,
                    role: "SERVICE_ENGINEER",
                    isActive: true
                }
            });

            if (!visitor) {
                return {
                    status: false,
                    data: null,
                    message: "Visitor not found or inactive"
                };
            }

            const result = await prisma.$transaction(async (tx) => {
                await tx.issueSiteVisit.create({
                    data: {
                        issueId: issueId,
                        siteVisitorId: visitor.id,
                        workingDepartment: siteVisitRequest.requestFromDepartment,
                        scheduledDate: scheduledDate,
                        siteVisitRequest: { connect: { id: siteVisitRequestId } },
                        workingHeadId: employeeId
                    }
                });

                const scheduled = new Date(scheduledDate);
                const formattedDate = scheduled.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });


                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId,
                        action: "SITE_VISIT_SCHEDULED",
                        visibleToCustomer: true,
                        comment: `Site visit scheduled on ${formattedDate}.

Assigned Service Engineer: ${visitor.name}
Mobile: ${visitor.mobile_no}`
                    }
                })

                await tx.issue.update({
                    where: {
                        id: issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitScheduled: true,
                        isSiteVisitRequested: true
                    }
                })



                await tx.siteVisitRequest.update({
                    where: {
                        id: siteVisitRequestId
                    },
                    data: {
                        status: 'COMPLETED',
                    }
                })

            });

            return {
                status: true,
                data: result,
                message: "Site visit scheduled successfully"
            };

        } catch (error) {
            console.error("Error scheduling site visit:", error);
            return {
                status: false,
                data: null,
                message: "Failed to schedule site visit"
            };
        }
    }

    /**
     * Schedule a site visit for issues directly under SERVICE department.
     * Does not depend on siteVisitRequest.
     * @param employeeId - Service Head ID
     * @param issueId - Issue ID
     * @param visitorId - Service engineer ID
     * @param scheduledDate - Scheduled Date
     * @returns Success or failure response
     */
    static async createSiteVisitScheduleForServiceDepartments(employeeId: string, issueId: string, visitorId: string, scheduledDate: Date) {
        try {

            const visitor = await prisma.employee.findUnique({
                where: {
                    id: visitorId,
                    role: "SERVICE_ENGINEER",
                    isActive: true
                }
            });

            if (!visitor) {
                return {
                    status: false,
                    data: null,
                    message: "Visitor not found or inactive"
                };
            }

            const visit = await prisma.issueSiteVisit.findFirst({
                where: {
                    issueId: issueId,
                    status: 'SCHEDULED'
                }
            })

            if (visit) {
                return {
                    status: false,
                    data: null,
                    message: "Visit Scheduled Already"
                }
            }

            const result = await prisma.$transaction(async (tx) => {
                await tx.issueSiteVisit.create({
                    data: {
                        issueId: issueId,
                        siteVisitorId: visitor.id,
                        workingDepartment: 'SERVICE',
                        scheduledDate: scheduledDate,
                        workingHeadId: employeeId
                    }
                });

                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId,
                        action: 'SITE_VISIT_SCHEDULED',
                        visibleToCustomer: true,
                        comment: `Site visit scheduled for ${scheduledDate} by Service Engineer ${visitor.name} (Mobile: ${visitor.mobile_no}).`
                    }
                })

                await tx.issue.update({
                    where: {
                        id: issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitScheduled: true,
                        isSiteVisitRequested: true
                    }
                })


            });

            return {
                status: true,
                data: result,
                message: "Site visit scheduled successfully"
            };

        } catch (error) {
            console.error("Error scheduling site visit:", error);
            return {
                status: false,
                data: null,
                message: "Failed to schedule site visit"
            };
        }
    }


    /**
     * Get list of all pending site visit requests.
     * Sorted by latest request date.
     * @returns List of site visit requests with issue details
     */
    static async getSiteVisitRequestsList() {
        try {
            const siteVisitRequests = await prisma.siteVisitRequest.findMany({
                where: {
                    status: 'PENDING'
                },
                orderBy: {
                    requestedAt: 'desc' // Order by newest first
                },
                select: {
                    id: true,
                    requestedAt: true,
                    requestFromDepartment: true,
                    requestFromName: true,
                    issueId: true,
                    issue: {
                        select: {
                            ticketNo: true,
                            description: true,
                            projectId: true,
                            customerId: true
                        }
                    }
                }
            });

            if (siteVisitRequests && siteVisitRequests.length > 0) {
                return {
                    status: true,
                    data: siteVisitRequests,
                    message: "Site visit requests fetched successfully"
                };
            }

            return {
                status: true, // Changed to true since no data is still a successful response
                data: [],
                message: "No pending site visit requests found"
            };

        } catch (error) {
            console.error('Error fetching site visit requests:', error);

            return {
                status: false,
                data: null,
                message: "Failed to fetch site visit requests"
            };
        }
    }
    /**
     * Service: getServiceEngineersList
     * ----------------------------------------
     * This service fetches all employees with role "SERVICE_ENGINEER".
     * It is used when a Service Head (or other department heads)
     * needs to assign a site visit to an available Service Engineer.
     */
    static async getServiceEngineersList() {
        try {
            const serviceEngineers = await prisma.employee.findMany({
                where: {
                    role: 'SERVICE_ENGINEER',
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    mobile_no: true,
                    isActive: true
                }
            });

            if (serviceEngineers && serviceEngineers.length > 0) {
                return {
                    status: true,
                    data: serviceEngineers,
                    message: "Service engineers fetched successfully"
                };
            }

            return {
                status: true,
                data: [],
                message: "No active service engineers found"
            };

        } catch (error) {
            console.error("Error fetching service engineers:", error);
            return {
                status: false,
                data: null,
                message: "Failed to fetch service engineers"
            };
        }
    }


    static async getSiteVisistsListByStatus(status: VisitStatus) {
        try {
            const visits = await prisma.issueSiteVisit.findMany({
                where: {
                    status: status
                },
                select: {
                    id: true,
                    scheduledDate: true,
                    actualDate: true,
                    workingDepartment: true,
                    siteVisitor: {
                        select: {
                            id: true,
                            name: true,
                            mobile_no: true
                        }
                    },
                    issue: {
                        select: {
                            ticketNo: true
                        }
                    }
                }
            })

            if (visits) {
                return {
                    status: true,
                    data: visits,
                    message: `Fetched ${status} visits`
                }
            }
            return {
                status: true,
                data: [],
                message: `Fetched ${status} visits`
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: `Failed to fetch ${status} Visits`
            }
        }
    }

}


export default DepartmentService 