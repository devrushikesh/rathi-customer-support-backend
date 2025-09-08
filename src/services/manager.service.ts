import type { InternalStatus } from "@prisma/client";
import prisma from "../prisma/client.js";

class ManagerServices {

    static async getNewIssues() {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    internalStatus: 'NEW'
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
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
                    isSiteVisitRequested: true
                },
            })

            return {
                status: true,
                data: issues,
                counts: issues.length,
                message: "New Issues found"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                counts: 0,
                message: "Internal Server Error"
            }
        }
    }

    static async getAllIssuesExcludeNew() {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    NOT: {
                        internalStatus: 'NEW'
                    }
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
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
            });
            return {
                status: true,
                data: issues,
                counts: issues.length,
                message: "All Issues Succesfully Fetched"
            }

        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Internal server Error"
            }
        }
    }

    static async getIssuesByStatus(status: InternalStatus) {
        try {

            const issues = await prisma.issue.findMany({
                where: {
                    internalStatus: status,
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
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
            });

            return {
                status: true,
                data: issues,
                message: `${status} Issues Succesfully Fetched`
            }

        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Internal server Error"
            }
        }
    }

    static async getHeadList() {
        try {
            const department_heads = await prisma.employee.findMany({
                where: {
                    role: 'HEAD',
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    role: true,
                    department: true
                }
            });
            return {
                status: true,
                data: department_heads,
                message: "Fetched Department Head List"
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Something went wrong"
            }
        }
    }

    static async assignIssueToDepartment(issueId: string, headId: string, managerId: string) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const employee = await tx.employee.findUnique({
                    where: {
                        id: headId,
                        isActive: true
                    }
                });

                if (!employee) {
                    throw new Error("Employee not found or not active");
                }

                const isIssueExist = await tx.issue.findUnique({
                    where: {
                        id: issueId
                    }
                })

                if (!isIssueExist) {
                    throw new Error("Issue not found");
                }

                const isAssignmentExist = await tx.issueAssignedDepartment.findFirst({
                    where: {
                        issueId: issueId,
                        isActive: true
                    }
                })

                if (isAssignmentExist) {
                    throw new Error(`This Issue Already assigned to the ${isAssignmentExist.employeeId} department`);
                }

                const newAssignment = await tx.issueAssignedDepartment.create({
                    data: {
                        issueId: issueId,
                        employeeId: headId
                    }
                })

                const newTimeLineEntry = await tx.issueTimeLine.create({
                    data: {
                        issueId: issueId,
                        fromInternalStatus: 'NEW',
                        toInternalStatus: 'OPEN',
                        action: 'ASSIGNED',
                        comment: `Issue Assigned to ${employee.name} - ${employee.department} Head.`,
                        performedBy: managerId
                    }
                })


                await tx.issue.update({
                    where: {
                        id: issueId
                    },
                    data: {
                        internalStatus: 'OPEN',
                        customerStatus: 'OPEN',
                        latestStatusId: newTimeLineEntry.id
                    }
                })

                return newAssignment;
            })

            return {
                status: true,
                data: result,
                message: "Issue Successfully Assigned."
            }
        } catch (error) {
            return {
                status: false,
                data: null,
                message: error
            }
        }
    }

    /**
 * Get a single issue by ID (only if it belongs to the customer)
 */
    static async getIssueById(issueId: string, managerId: string) {
        try {

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

}


export default ManagerServices;