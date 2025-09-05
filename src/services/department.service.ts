import type { InternalStatus } from "@prisma/client";
import prisma from "../prisma/client.js";

class DepartmentService {

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
                            email: true
                        }
                    },
                    timeline: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    },
                    project: {

                        select: {
                            projectName: true,
                            machineType: true,
                            capacity: true,
                            location: true,
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
    // This Service not for 
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
                    }
                }
            });

            if (!assignment || !assignment.employee?.department) {
                return { status: false, data: null, message: "Employee not found or not assigned" };
            }

            await prisma.$transaction(async (tx) => {
                // 1. Create site visit request
                await tx.siteVisitRequest.create({
                    data: {
                        issueId,
                        requestFromHeadId: employeeId,
                        requestFromName: assignment.employee.name,
                        requestFromDepartment: assignment.employee.department!,
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
                    data: { latestStatusId: latestIssueTimeLineEntry.id }
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

    static async makeCommentInIssue(employeeId: string, issueId: string, comment: string) {
        try {
            // Verify employee is assigned to this issue
            const assignment = await prisma.issueAssignedDepartment.findFirst({
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
                return {
                    status: false,
                    data: null,
                    message: "Employee is not assigned to this issue"
                };
            }

            const latestIssueTimeLineEntry = await prisma.issueTimeLine.create({
                data: {
                    issueId,
                    action: "COMMENT_ADDED",
                    comment,
                    performedBy: employeeId,
                }
            });

            await prisma.issue.update({
                where: {
                    id: issueId
                },
                data: {
                    latestStatusId: latestIssueTimeLineEntry.id
                }
            })


            return {
                status: true,
                data: null,
                message: "Comment added successfully"
            };
        } catch (error) {
            console.error("Error adding comment:", error);
            return {
                status: false,
                data: null,
                message: "Something went wrong while adding comment"
            };
        }
    }

    static async createSiteVisitScheduleForOtherDepartments(employeeId: string, issueId: string, visitorId: string, siteVisitRequestId: string, scheduledDate: Date) {
        try {
            const siteVisitRequest = await prisma.siteVisitRequest.findUnique({
                where: {
                    id: siteVisitRequestId,
                    issueId: issueId,
                    status: 'PENDING'
                }
            })

            if (!siteVisitRequest || siteVisitRequest.status == "PENDING" || !siteVisitRequest.requestFromDepartment) {
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
                        latestStatusId: latestIssueTimeLineEntry.id
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
                        latestStatusId: latestIssueTimeLineEntry.id
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

}


export default DepartmentService 