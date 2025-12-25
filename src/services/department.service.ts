import type { InternalStatus, VisitStatus } from "@prisma/client";
import prisma from "../prisma/client.js";
import { sendPushNotification } from "./firebase.service.js";


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
                    dueDate: true,
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
                    dueDate: true,
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
                    },
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

                const fcmToken = await tx.deviceToken.findUnique({
                    where: {
                        userId: issue.customerId.toString()
                    }
                })

                if (fcmToken) {
                    sendPushNotification(fcmToken.token, {
                        title: "Issue Taken up for Processing",
                        body: `Team Started working on your issue with ticket No: ${issue.ticketNo} .\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: issue.id
                    });
                }

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
                const updatedIssue = await tx.issue.update({
                    where: { id: issueId },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitRequested: true
                    }
                });


                const serviceHeadId = await tx.employee.findFirst({
                    where: {
                        department: 'SERVICE',
                        role: 'HEAD'
                    },
                    select: {
                        id: true
                    }
                })

                if (!serviceHeadId) {
                    throw new Error("Invalid Request");
                }

                const fcmToken = await tx.deviceToken.findUnique({
                    where: {
                        userId: serviceHeadId.id
                    }
                })

                console.log(fcmToken);


                if (fcmToken) {
                    sendPushNotification(fcmToken.token, {
                        title: "Site Visit Request",
                        body: `Site visit requested for ticket No: ${updatedIssue.ticketNo} .\n tap to view details.`
                    }, {
                        action: 'OPEN_SITE_VISIT_MANAGE_PAGE',
                        siteVisitRequestId: siteVisitRequest!.id
                    });
                }

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

                const updatedIssue = await tx.issue.update({
                    where: {
                        id: updatedRequest.issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitRequested: false
                    }
                })

                const workingHeadId = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        issueId: updatedIssue.id
                    },
                    select: {
                        employeeId: true
                    }
                })

                if (!workingHeadId) {
                    throw new Error("Invalid Request");
                }

                const fcmToken = await tx.deviceToken.findUnique({
                    where: {
                        userId: workingHeadId.employeeId
                    }
                })

                if (fcmToken) {
                    sendPushNotification(fcmToken.token, {
                        title: "Site Visit Request Rejected",
                        body: `Service head had rejected site visit request for ticket No: ${updatedIssue.ticketNo} .\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: updatedIssue.id
                    });
                }

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
            const updatedIssue = await tx.issue.update({
                where: {
                    id: issueId
                },
                data: {
                    latestStatusId: latestIssueTimeLineEntry.id
                }
            });

            if (isVisibleToCustomer) {
                const fcmToken = await tx.deviceToken.findUnique({
                    where: {
                        userId: updatedIssue.customerId.toString()
                    }
                })

                if (fcmToken) {
                    sendPushNotification(
                        fcmToken.token,
                        {
                            title: "New Comment on Your Ticket",
                            body: `A new comment was added to Ticket #${updatedIssue.ticketNo}:\n“${comment}”\n\nTap to view the full details.`,
                        },
                        {
                            action: "OPEN_TICKET_DETAIL_PAGE",
                            issueId: updatedIssue.id,
                        }
                    );
                }
            }


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

                const updatedIssue = await tx.issue.update({
                    where: {
                        id: issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitScheduled: true,
                        isSiteVisitRequested: true
                    }
                })

                await tx.employee.update({
                    where: { id: visitorId },
                    data: { pendingVisits: { increment: 1 } }
                })



                await tx.siteVisitRequest.update({
                    where: {
                        id: siteVisitRequestId
                    },
                    data: {
                        status: 'COMPLETED',
                    }
                })

                const workingHeadId = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        issueId: updatedIssue.id
                    },
                    select: {
                        employeeId: true
                    }
                })

                if (!workingHeadId) {
                    throw new Error("Invalid Request");
                }


                const orConditions: any[] = [
                    { userId: updatedIssue.customerId.toString() },
                    { userId: workingHeadId.employeeId.toString() }
                ];

                const fcmToken = await tx.deviceToken.findMany({
                    where: {
                        OR: orConditions
                    }
                })

                if (fcmToken.length > 0) {
                    sendPushNotification(fcmToken[0]!.token, {
                        title: "Site Visit Scheduled",
                        body: `Site Visit Scheduled for ${updatedIssue.ticketNo} on ${formattedDate}.\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: updatedIssue.id
                    });

                    if (fcmToken.length > 1) {
                        sendPushNotification(fcmToken[1]!.token, {
                            title: "Site Visit Scheduled Successfully",
                            body: `Service head has been scheduled site visit for ticket No: ${updatedIssue.ticketNo} .\n tap to view details.`
                        }, {
                            action: 'OPEN_TICKET_DETAIL_PAGE',
                            issueId: updatedIssue.id
                        });
                    }
                }
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
    static async createSiteVisitScheduleForServiceDepartments(employeeId: string, issueId: string, visitorId: string, scheduledDate: Date, department: string) {
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

                const scheduled = new Date(scheduledDate);
                const formattedDate = scheduled.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });


                const latestIssueTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId,
                        action: 'SITE_VISIT_SCHEDULED',
                        visibleToCustomer: true,
                        comment: `Site visit scheduled on ${formattedDate}.

Assigned Service Engineer: ${visitor.name}
Mobile: ${visitor.mobile_no}`
                    }
                })

                await tx.employee.update({
                    where: { id: visitorId },
                    data: { pendingVisits: { increment: 1 } }
                })

                const updatedIssue = await tx.issue.update({
                    where: {
                        id: issueId
                    },
                    data: {
                        latestStatusId: latestIssueTimeLineEntry.id,
                        isSiteVisitScheduled: true,
                        isSiteVisitRequested: true
                    }
                });




                const orConditions: any[] = [
                    { userId: updatedIssue.customerId.toString() },
                ];

                const fcmTokenCustomer = await tx.deviceToken.findMany({
                    where: {
                        OR: orConditions
                    }
                })

                if (fcmTokenCustomer) {
                    sendPushNotification(fcmTokenCustomer[0]!.token, {
                        title: "Site Visit Cancelled",
                        body: `Your scheduled site visit for ticket No: ${updatedIssue.ticketNo} has been cancelled.\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: updatedIssue.id
                    });
                }

                return true;

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
                    email: true,
                    mobile_no: true,
                    pendingVisits: true,
                    completedVisits: true,
                    location: true,
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
                    issueId: true,
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
            console.log(visits);

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


    static async completeScheduledSiteVisit(headId: string, siteVisitId: string, department: string) {
        try {

            const transaction = await prisma.$transaction(async (tx) => {

                const oldSiteVisitEntry = await tx.issueSiteVisit.findUnique({
                    where: {
                        id: siteVisitId,
                        status: 'SCHEDULED'
                    }
                })

                if (!oldSiteVisitEntry) {
                    throw new Error("Invalid Request!");
                }


                await tx.employee.update({
                    where: { id: oldSiteVisitEntry.siteVisitorId },
                    data: {
                        pendingVisits: { decrement: 1 },
                        completedVisits: { increment: 1 }
                    }
                })



                await tx.issueSiteVisit.update({
                    where: {
                        id: siteVisitId
                    },
                    data: {
                        status: 'COMPLETED',
                        actualDate: new Date()
                    }
                })


                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

                const newTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        action: 'SITE_VISIT_COMPLETED',
                        performedBy: headId,
                        issueId: oldSiteVisitEntry.issueId,
                        visibleToCustomer: true,
                        comment: `Site visit Completed on ${formattedDate}.`
                    }
                })

                const updatedIssue = await tx.issue.update({
                    where: {
                        id: oldSiteVisitEntry.issueId
                    },
                    data: {
                        latestStatusId: newTimeLineEntry.id,
                        isSiteVisitRequested: false,
                        isSiteVisitScheduled: false
                    }
                })


                const workingHeadId = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        issueId: updatedIssue.id
                    },
                    select: {
                        employeeId: true
                    }
                })

                if (!workingHeadId) {
                    throw new Error("Invalid Request");
                }


                const orConditions: any[] = [
                    { userId: updatedIssue.customerId.toString() },
                ];

                if (department !== 'SERVICE') {
                    orConditions.push({ userId: workingHeadId.employeeId.toString() });
                }

                const fcmTokenCustomer = await tx.deviceToken.findMany({
                    where: {
                        OR: orConditions
                    }
                })

                if (fcmTokenCustomer) {
                    sendPushNotification(fcmTokenCustomer[0]!.token, {
                        title: "Site Visit Cancelled",
                        body: `Your scheduled site visit for ticket No: ${updatedIssue.ticketNo} has been cancelled.\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: updatedIssue.id
                    });
                }



                return true
            })

            return {
                status: true,
                data: null,
                message: 'Visit Completed Successfully'
            }

        } catch (error) {
            return {
                status: true,
                data: null,
                message: 'Failed To Complete Visit'
            }
        }
    }


    static async cancelScheduledSiteVisit(headId: string, siteVisitId: string, department: string, remark?: string) {
        try {

            const transaction = await prisma.$transaction(async (tx) => {

                const oldSiteVisitEntry = await tx.issueSiteVisit.findUnique({
                    where: {
                        id: siteVisitId,
                        status: 'SCHEDULED'
                    }
                })

                if (!oldSiteVisitEntry) {
                    throw new Error("Invalid Request!");
                }


                await tx.employee.update({
                    where: { id: oldSiteVisitEntry.siteVisitorId },
                    data: {
                        pendingVisits: { decrement: 1 }
                    }
                })

                await tx.issueSiteVisit.update({
                    where: {
                        id: siteVisitId
                    },
                    data: {
                        status: 'CANCELLED',
                        actualDate: new Date()
                    }
                })

                const newTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        action: 'SITE_VISIT_CANCELLED',
                        performedBy: headId,
                        issueId: oldSiteVisitEntry.issueId,
                        visibleToCustomer: true,
                        comment: `Site visit has been cancelled.\nRemark: ${remark || 'No additional remarks provided.'}`

                    }
                })

                const updatedIssue = await tx.issue.update({
                    where: {
                        id: oldSiteVisitEntry.issueId
                    },
                    data: {
                        latestStatusId: newTimeLineEntry.id,
                        isSiteVisitRequested: false,
                        isSiteVisitScheduled: false
                    }
                })

                const workingHeadId = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        issueId: updatedIssue.id
                    },
                    select: {
                        employeeId: true
                    }
                })

                if (!workingHeadId) {
                    throw new Error("Invalid Request");
                }

                const orConditions: any[] = [
                    { userId: updatedIssue.customerId.toString() },
                ];

                if (department !== 'SERVICE') {
                    orConditions.push({ userId: workingHeadId.employeeId.toString() });
                }

                const fcmTokenCustomer = await tx.deviceToken.findMany({
                    where: {
                        OR: orConditions
                    }
                })

                if (fcmTokenCustomer) {
                    sendPushNotification(fcmTokenCustomer[0]!.token, {
                        title: "Site Visit Cancelled",
                        body: `Your scheduled site visit for ticket No: ${updatedIssue.ticketNo} has been cancelled.\n tap to view details.`
                    }, {
                        action: 'OPEN_TICKET_DETAIL_PAGE',
                        issueId: updatedIssue.id
                    });
                }

                return true
            })

            return {
                status: true,
                data: null,
                message: 'Site visit cancelled successfully'
            }

        } catch (error) {
            return {
                status: true,
                data: null,
                message: 'Failed to cancel site visit'
            }
        }
    }


    static async markResolveIssue(headId: string, issueId: string, remark?: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Validate issue belongs to head and is not already closed
            const issueEntry = await tx.issue.findFirst({
                where: {
                    id: issueId,
                    internalStatus: { not: "CLOSED" }, // prevent re-closing
                    assignedDepartments: {
                        some: { employeeId: headId },
                    },
                }
            });

            if (!issueEntry) {
                throw new Error("Invalid Request");
            }

            // 2. Find pending site visit OR requests in parallel
            const [siteVisitEntry, siteVisitRequest] = await Promise.all([
                tx.issueSiteVisit.findFirst({
                    where: { issueId, status: "SCHEDULED" },
                }),
                tx.siteVisitRequest.findFirst({
                    where: { issueId, status: "PENDING" },
                }),
            ]);



            // 3. Prepare bulk timeline entries
            const timelineEntries: any[] = [];

            if (siteVisitEntry) {
                await tx.issueSiteVisit.update({
                    where: { id: siteVisitEntry.id },
                    data: { status: "CANCELLED" },
                });

                await tx.employee.update({
                    where: { id: siteVisitEntry.id },
                    data: {
                        pendingVisits: { decrement: 1 }
                    }
                })

                timelineEntries.push({
                    action: "SITE_VISIT_CANCELLED",
                    comment: "Scheduled Site Visit cancelled due to issue resolution.",
                    performedBy: headId,
                    issueId,
                    visibleToCustomer: true,
                });
            }

            if (siteVisitRequest) {
                await tx.siteVisitRequest.update({
                    where: { id: siteVisitRequest.id },
                    data: { status: "CANCELLED" },
                });
                timelineEntries.push({
                    action: "SITE_VISIT_REQUEST_CANCELLED",
                    comment: "Site Visit Request cancelled due to issue resolution.",
                    performedBy: headId,
                    issueId,
                    visibleToCustomer: false,
                });
            }
            // Always add RESOLVED timeline
            timelineEntries.push({
                action: "RESOLVED",
                comment: `Issue has been successfully resolved.${remark && remark.trim() !== "" ? `\nRemark: ${remark.trim()}` : ""}`,
                performedBy: headId,
                issueId,
                visibleToCustomer: true,
            });


            // 4. Create all timeline entries at once
            const createdTimelines = await tx.issueTimeLine.createManyAndReturn?.({
                data: timelineEntries,
            }) ?? await Promise.all(
                timelineEntries.map((entry) => tx.issueTimeLine.create({ data: entry }))
            );

            // 5. Update issue with latest timeline entry
            const latestTimeline = createdTimelines[createdTimelines.length - 1];
            if (!latestTimeline) {
                throw new Error("Failed to create timeline entry while resolving issue");
            }
            await tx.issue.update({
                where: { id: issueId },
                data: {
                    internalStatus: "CLOSED",
                    customerStatus: "CLOSED",
                    latestStatusId: latestTimeline.id,
                    isSiteVisitRequested: false,
                    isSiteVisitScheduled: false,
                    isAttachmentsRequested: false,
                    resolvedAt: new Date(),
                },
            });

            await tx.issueAssignedDepartment.updateMany({
                where: {
                    issueId: issueId,
                    employeeId: headId,
                    isActive: true
                },
                data: {
                    isActive: false
                }
            })

            const fcmToken = await tx.deviceToken.findUnique({
                where: {
                    userId: issueEntry.customerId.toString()
                }
            })

            if (fcmToken) {
                sendPushNotification(fcmToken.token, {
                    title: "Ticket is Closed",
                    body: `Your Issue is resolved ticket No: ${issueEntry.ticketNo}.\n tap to view details.`
                }, {
                    action: 'OPEN_TICKET_DETAIL_PAGE',
                    issueId: issueId
                });
            }

            return { status: true, message: "Issue resolved successfully" };
        });
    }

    static async addServiceEngineer(
        name: string,
        mobile_no: string,
        email: string,
        location: string
    ) {

        const new_employee = await prisma.employee.create({
            data: {
                role: "SERVICE_ENGINEER",
                name: name.trim(),
                email: email.trim(),
                mobile_no: mobile_no.trim(),
                department: "SERVICE",
                location: location.trim(),
                pendingVisits: 0,
                completedVisits: 0,
            },
        });

        return new_employee;
    }

    static async getTeamPageStats() {
        const employeeCount = await prisma.employee.count({
            where: {
                role: 'SERVICE_ENGINEER',
                isActive: true
            }
        })

        const scheduledVisitCount = await prisma.issueSiteVisit.count({
            where: {
                status: 'SCHEDULED'
            }
        })

        const visitRequestCount = await prisma.siteVisitRequest.count({
            where: {
                status: 'PENDING'
            }
        })


        return {
            employeeCount: employeeCount,
            scheduledVisitCount: scheduledVisitCount,
            visitRequestCount: visitRequestCount
        }
    }

    static async getUpcomingSiteVisitSchedules(siteEngId: string) {
        const upcomingSchedules = await prisma.issueSiteVisit.findMany({
            where: {
                siteVisitorId: siteEngId,
                status: 'SCHEDULED'
            },
            select: {
                scheduledDate: true,
                issue: {
                    select: {
                        ticketNo: true,
                    }
                },
                workingDepartment: true
            }
        })
        return upcomingSchedules
    }

    static async updateServiceEngineer(siteEngId: string, name?: string, mobile_no?: string, email?: string, location?: string, isActive?: boolean) {
        const updatedData: any = {};
        if (name) updatedData.name = name;
        if (mobile_no) updatedData.mobile_no = mobile_no;
        if (email) updatedData.email = email;
        if (location) updatedData.location = location;
        if (isActive !== undefined) updatedData.isActive = isActive;

        const updatedEngineer = await prisma.employee.update({
            where: { id: siteEngId },
            data: updatedData,
        });

        return updatedEngineer;
    }


    static async requestAttachmentForIssue(employeeId: string, issueId: string, comment: string) {
        const result = await prisma.$transaction(async (tx) => {
            // Verify employee is assigned to this issue
            const assignment = await tx.issueAssignedDepartment.findFirst({
                where: {
                    issueId,
                    employeeId,
                    isActive: true,
                    employee: { isActive: true },
                    issue: { isAttachmentsRequested: false }
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
                    action: "ATTACHMENT_REQUESTED",
                    comment: `Attachments have been requested for this issue.\n Remark: ${comment}`,
                    visibleToCustomer: true,
                    performedBy: employeeId,
                }
            });

            // Update the issue with the latest status
            await tx.issue.update({
                where: {
                    id: issueId
                },
                data: {
                    isAttachmentsRequested: true,
                    attachmentsRequestedByID: employeeId,
                    latestStatusId: latestIssueTimeLineEntry.id
                }
            });

            const issue = await tx.issue.findUnique({
                where: {
                    id: issueId
                },
                select: {
                    customerId: true,
                    ticketNo: true
                }
            })

            if (!issue) {
                throw new Error("Invalid Request");
            }

            const fcmToken = await tx.deviceToken.findUnique({
                where: {
                    userId: issue.customerId.toString()
                }
            })

            if (fcmToken) {
                sendPushNotification(fcmToken.token, {
                    title: "Request From Rathi Engineering!",
                    body: `Please upload attachments for ticket No: ${issue.ticketNo}.\n tap to upload attachments.`
                }, {
                    action: 'OPEN_TICKET_DETAIL_PAGE',
                    issueId: issueId
                });
            }

            return {
                status: true,
                data: null,
                message: "Attachment request added successfully"
            };
        })
        return result;
    }

    static async getHomePageStats(employeeId: string) {

        const totalIssuesCount = await prisma.issue.count({
            where: {
                assignedDepartments: {
                    some: {
                        employeeId: employeeId
                    }
                }
            }
        })

        const openIssuesCount = await prisma.issue.count({
            where: {
                internalStatus: 'OPEN',
                assignedDepartments: {
                    some: {
                        employeeId: employeeId
                    }
                }
            }
        })

        const closedIssuesCount = await prisma.issue.count({
            where: {
                internalStatus: 'CLOSED',
                assignedDepartments: {
                    some: {
                        employeeId: employeeId
                    }
                }
            }
        })

        const inProgressIssuesCount = await prisma.issue.count({
            where: {
                internalStatus: {
                    notIn: ['CLOSED', 'OPEN']
                },
                assignedDepartments: {
                    some: {
                        employeeId: employeeId
                    }
                }
            }
        });

        const userName = await prisma.employee.findUnique({
            where: {
                id: employeeId
            },
            select: {
                name: true
            }
        })

        return {
            status: true,
            message: "feched stats successfully",
            data: {
                userName,
                totalIssuesCount,
                openIssuesCount,
                closedIssuesCount,
                inProgressIssuesCount
            }
        }
    }


}


export default DepartmentService 