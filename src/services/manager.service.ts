import type { InternalStatus } from "@prisma/client";
import prisma from "../prisma/client.js";

class ManagerServices {

    static async getProjectDetailById(projectId: number) {
        try {
            const project = await prisma.projects.findUnique({
                where: {
                    id: projectId
                }
            });

            if (!project) {
                return {
                    status: false,
                    data: null,
                    message: "Project not found"
                };
            }

            return {
                status: true,
                data: project,
                message: "Project details fetched successfully"
            };
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Failed to fetch project details"
            };
        }
    }


    static async getCustomerDetailsById(customerId: number) {

        try {
            const customer = await prisma.customer.findUnique({
                where: {
                    id: customerId
                }
            });

            const projects = await prisma.projects.findMany({
                where: {
                    customerId: customerId
                },
                select: {
                    id: true,
                    projectName: true,
                    createdAt: true
                }
            });



            if (!customer) {
                return {
                    status: false,
                    data: null,
                    message: "Customer not found"
                };
            }

            return {
                status: true,
                data: { customer, projects },
                message: "Customer details fetched successfully"
            };
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Failed to fetch customer details"
            };
        }
    }


    static async createProject(projectName: string, customerId: number, machineType: string, capacity: string, location: string, application: string, feedSize: string, finalProductSize: string) {
        try {
            const customer = await prisma.customer.findUnique({
                where: {
                    id: customerId
                }
            });

            if (!customer) {
                return {
                    status: false,
                    data: null,
                    message: "Customer not found"
                };
            }

            const newProject = await prisma.projects.create({
                data: {
                    projectName,
                    customerId,
                    machineType,
                    capacity,
                    location,
                    application,
                    feedSize,
                    finalProductSize
                }
            });
            return {
                status: true,
                data: newProject,
                message: "Project created successfully"
            };
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Failed to create project"
            };
        }
    }

    static async createCustomer(name: string, mobile_no: string, email: string) {
        try {
            const existingCustomer = await prisma.customer.findFirst({
                where: { mobile_no: mobile_no },
            });
            if (existingCustomer) {
                return {
                    status: false,
                    data: null,
                    message: "Customer with this mobile number already exists",
                };
            }

            const newCustomer = await prisma.customer.create({
                data: {
                    name,
                    mobile_no,
                    email
                },
            });

            return {
                status: true,
                data: newCustomer,
                message: "Customer created successfully",
            };
        } catch (error) {
            return {
                status: false,
                data: null,
                message: "Failed to create customer",
            };
        }
    }


    static async getManageStats() {
        const totalCustomers = await prisma.customer.count();
        const totalProjects = await prisma.projects.count();
        return {
            status: true,
            data: {
                totalCustomers,
                totalProjects
            },
            message: "Stats fetched successfully"
        }
    }

    static async getCustomerList() {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true
            }
        });

        return {
            status: true,
            data: customers,
            message: "Customer List fetched successfully"
        }
    }

    static async getAllProjectList() {
        const projects = await prisma.projects.findMany({
            select: {
                id: true,
                projectName: true,
                customerId: true,
                createdAt: true
            }
        });

        return {
            status: true,
            data: projects,
            message: "Project List fetched successfully"
        }
    }


    static async getNewIssues() {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    internalStatus: 'NEW'
                },
                orderBy: {
                    createdAt: 'desc' // Chronological order
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
                    createdAt: 'desc' // Chronological order
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
                    createdAt: 'desc' // Chronological order
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


    static async markInvalidIssue(employeeId: string, issueId: string, reason?: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Validate issue belongs to head and is not already closed
            const issueEntry = await tx.issue.findFirst({
                where: {
                    id: issueId,
                    internalStatus: { not: "CLOSED" }
                }
            });

            if (!issueEntry || issueEntry.internalStatus != "NEW") {
                throw new Error("Invalid Request");
            }

            // 2. Prepare timeline entry for INVALID status

            // 3. Create timeline entry
            const createdTimeline = await tx.issueTimeLine.create({
                data: {
                    action: 'INVALID',
                    comment: `Issue has been marked as invalid.${reason && reason.trim() !== "" ? `\nReason: ${reason.trim()}` : ""}`,
                    performedBy: employeeId,
                    issueId,
                    visibleToCustomer: true,
                }
            });

            if (!createdTimeline) {
                throw new Error("Failed to create timeline entry while marking issue as invalid");
            }

            // 4. Update issue with latest timeline entry
            await tx.issue.update({
                where: { id: issueId },
                data: {
                    internalStatus: "CLOSED",
                    customerStatus: "CLOSED",
                    latestStatusId: createdTimeline.id,
                    isSiteVisitRequested: false,
                    isSiteVisitScheduled: false,
                    isAttachmentsRequested: false,
                    resolvedAt: new Date(),
                },
            });

            return { status: true, message: "Issue marked as invalid successfully" };
        });
    }

}


export default ManagerServices;