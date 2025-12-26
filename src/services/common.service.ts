
import prisma from "../prisma/client.js";
import { generateGetPresignedUrl } from "./s3.service.js";

class CommonServices {

    static async getPresignedGetUrl(key: string, role: string, userId: string | number) {
        const splitedKey = key.split("/")
        if (splitedKey.length != 3) {
            throw new Error("Invalid key");
        }

        const ticketNo = splitedKey[1];

        if (!ticketNo) {
            throw new Error("Invalid key");
        }

        let issue;


        if (role == "CUSTOMER") {
            issue = await prisma.issue.findUnique({
                where: {
                    ticketNo: ticketNo,
                    customerId: parseInt(userId.toString())
                }
            })

            if (!issue) {
                throw new Error("Permission Denied");
            }
        }
        else if (role == "HEAD") {
            issue = await prisma.issue.findUnique({
                where: {
                    ticketNo: ticketNo,
                    assignedDepartments: {
                        some: {
                            employeeId: userId.toString(),
                        }
                    }
                }
            })
            if (!issue) {
                throw new Error("Permission Denied");
            }
        }



        const url = await generateGetPresignedUrl(key);

        return url;
    }


    static async getProfile(userId: string | number, role: string) {
        let profile;
        if (role == "CUSTOMER") {
            profile = await prisma.customer.findUnique({
                where: {
                    id: parseInt(userId.toString())
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile_no: true
                }
            })
        }
        else {
            profile = await prisma.employee.findUnique({
                where: {
                    id: userId.toString()
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile_no: true
                }
            })
        }

        return profile;
    }

    static async updateFcmToken(user_id: number, role: string, device_token: string) {
        try {
            await prisma.deviceToken.upsert({
                where: {
                    userId: user_id.toString()
                },
                update: {
                    token: device_token
                },
                create: {
                    userId: user_id.toString(),
                    token: device_token
                }
            })

            return {
                status: true,
                message: "Device Token Updated Successfully"
            }

        } catch (error) {
            return {
                status: false,
                message: "Internal Server Error!"
            }
        }
    }

    // Report Generation APIs
    static async generateDepartmentHeadReport(
        employeeId: string,
        startDate: string,
        endDate: string
    ) {
        try {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { name: true, department: true, role: true }
            });

            if (!employee) {
                return {
                    status: false,
                    data: null,
                    message: "Employee not found"
                };
            }

            if (employee.role !== 'HEAD') {
                return {
                    status: false,
                    data: null,
                    message: "This report is only for department heads"
                };
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Get all issues assigned to this department head
            const assignedIssues = await prisma.issueAssignedDepartment.findMany({
                where: {
                    employeeId: employeeId,
                    assignedAt: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    issue: {
                        include: {
                            customer: {
                                select: { name: true, email: true, mobile_no: true }
                            },
                            project: {
                                select: { projectName: true, machineType: true, location: true }
                            },
                            timeline: {
                                orderBy: { createdAt: 'asc' },
                                select: {
                                    action: true,
                                    createdAt: true,
                                    comment: true,
                                    toInternalStatus: true
                                }
                            }
                        }
                    }
                },
                orderBy: { assignedAt: 'desc' }
            });

            // Calculate statistics
            const totalIssues = assignedIssues.length;
            const completedIssues = assignedIssues.filter(
                a => ['RESOLVED', 'CLOSED'].includes(a.issue.internalStatus)
            ).length;
            const pendingIssues = assignedIssues.filter(
                a => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(a.issue.internalStatus)
            ).length;
            const inProgressIssues = assignedIssues.filter(
                a => a.issue.internalStatus === 'IN_PROGRESS'
            ).length;

            // Format detailed issue list
            const detailedIssues = assignedIssues.map(assignment => {
                const issue = assignment.issue;
                const createdEvent = issue.timeline.find(t => t.action === 'ISSUE_CREATED');
                const assignedEvent = issue.timeline.find(t => t.action === 'ASSIGNED');
                const resolvedEvent = issue.timeline.find(t => t.action === 'RESOLVED');

                return {
                    ticketNo: issue.ticketNo,
                    description: issue.description,
                    status: issue.internalStatus,
                    customerStatus: issue.customerStatus,
                    priority: issue.priority,
                    customer: issue.customer,
                    project: issue.project,
                    createdAt: issue.createdAt,
                    assignedAt: assignment.assignedAt,
                    resolvedAt: issue.resolvedAt,
                    initialDeadline: assignment.initialDeadline,
                    finalDeadline: assignment.finalDeadline,
                    daysToResolve: issue.resolvedAt 
                        ? Math.ceil((issue.resolvedAt.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                        : null,
                    isOverdue: assignment.finalDeadline 
                        ? new Date() > assignment.finalDeadline && !issue.resolvedAt
                        : false
                };
            });

            return {
                status: true,
                data: {
                    reportInfo: {
                        generatedFor: employee.name,
                        department: employee.department,
                        role: employee.role,
                        dateRange: {
                            from: startDate,
                            to: endDate
                        },
                        generatedAt: new Date().toISOString()
                    },
                    summary: {
                        totalIssues,
                        completedIssues,
                        pendingIssues,
                        inProgressIssues,
                        completionRate: totalIssues > 0 
                            ? ((completedIssues / totalIssues) * 100).toFixed(2) + '%'
                            : '0%'
                    },
                    issues: detailedIssues
                },
                message: "Department head report generated successfully"
            };
        } catch (error) {
            console.error("Error generating department head report:", error);
            return {
                status: false,
                data: null,
                message: "Failed to generate report"
            };
        }
    }

    static async generateManagerReport(
        startDate: string,
        endDate: string,
        department?: string
    ) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Build where clause
            const whereClause: any = {
                createdAt: {
                    gte: start,
                    lte: end
                }
            };

            // Get all issues in date range
            const allIssues = await prisma.issue.findMany({
                where: whereClause,
                include: {
                    customer: {
                        select: { id: true, name: true }
                    },
                    project: {
                        select: { id: true, projectName: true }
                    },
                    assignedDepartments: {
                        where: { isActive: true },
                        include: {
                            employee: {
                                select: { name: true, department: true, role: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Filter issues by department if specified
            let filteredIssues = allIssues;
            if (department) {
                filteredIssues = allIssues.filter(issue => 
                    issue.assignedDepartments.some(
                        assignment => assignment.employee.department === department
                    )
                );
            }

            // Overall statistics
            const totalIssues = filteredIssues.length;
            const completedIssues = filteredIssues.filter(
                i => ['RESOLVED', 'CLOSED'].includes(i.internalStatus)
            ).length;
            const pendingIssues = filteredIssues.filter(
                i => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(i.internalStatus)
            ).length;
            const newIssues = filteredIssues.filter(i => i.internalStatus === 'NEW').length;
            const inProgressIssues = filteredIssues.filter(i => i.internalStatus === 'IN_PROGRESS').length;
            const cancelledIssues = filteredIssues.filter(i => i.internalStatus === 'CANCELLED').length;

            // Department-wise breakdown (group issues by department)
            const departmentStats: any = {};
            
            for (const issue of filteredIssues) {
                for (const assignment of issue.assignedDepartments) {
                    const dept = assignment.employee.department;
                    if (!dept) continue;

                    if (!departmentStats[dept]) {
                        departmentStats[dept] = {
                            department: dept,
                            totalIssues: 0,
                            completed: 0,
                            pending: 0,
                            inProgress: 0,
                            issues: []
                        };
                    }

                    // Check if issue already added to this department
                    const alreadyAdded = departmentStats[dept].issues.some(
                        (i: any) => i.ticketNo === issue.ticketNo
                    );

                    if (!alreadyAdded) {
                        const isCompleted = ['RESOLVED', 'CLOSED'].includes(issue.internalStatus);
                        const isPending = !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(issue.internalStatus);
                        const isInProgress = issue.internalStatus === 'IN_PROGRESS';

                        departmentStats[dept].totalIssues++;
                        if (isCompleted) departmentStats[dept].completed++;
                        if (isPending) departmentStats[dept].pending++;
                        if (isInProgress) departmentStats[dept].inProgress++;

                        // Add simplified issue details to department
                        departmentStats[dept].issues.push({
                            ticketNo: issue.ticketNo,
                            customerId: issue.customer.id,
                            customerName: issue.customer.name,
                            projectId: issue.project.id,
                            projectName: issue.project.projectName,
                            createdAt: issue.createdAt,
                            deadlineDate: assignment.finalDeadline || assignment.initialDeadline,
                            resolvedAt: issue.resolvedAt
                        });
                    }
                }
            }

            // Convert to array and add completion rate
            const departmentWiseBreakdown = Object.values(departmentStats).map((dept: any) => ({
                ...dept,
                completionRate: dept.totalIssues > 0 
                    ? ((dept.completed / dept.totalIssues) * 100).toFixed(2) + '%'
                    : '0%'
            }));

            // Status-wise breakdown
            // Status-wise breakdown
            const statusBreakdown = {
                NEW: newIssues,
                IN_PROGRESS: inProgressIssues,
                RESOLVED: filteredIssues.filter(i => i.internalStatus === 'RESOLVED').length,
                CLOSED: filteredIssues.filter(i => i.internalStatus === 'CLOSED').length,
                CANCELLED: cancelledIssues,
                REOPENED: filteredIssues.filter(i => i.internalStatus === 'REOPENED').length
            };

            // Average resolution time
            const resolvedIssuesWithTime = filteredIssues.filter(i => i.resolvedAt);
            const avgResolutionTime = resolvedIssuesWithTime.length > 0
                ? resolvedIssuesWithTime.reduce((sum, issue) => {
                    const days = Math.ceil(
                        (issue.resolvedAt!.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return sum + days;
                }, 0) / resolvedIssuesWithTime.length
                : 0;

            return {
                status: true,
                data: {
                    reportInfo: {
                        reportType: "Manager Report",
                        dateRange: {
                            from: startDate,
                            to: endDate
                        },
                        filterApplied: department ? { department } : null,
                        generatedAt: new Date().toISOString()
                    },
                    overallSummary: {
                        totalIssues,
                        completedIssues,
                        pendingIssues,
                        inProgressIssues,
                        newIssues,
                        cancelledIssues,
                        completionRate: totalIssues > 0 
                            ? ((completedIssues / totalIssues) * 100).toFixed(2) + '%'
                            : '0%',
                        avgResolutionDays: avgResolutionTime.toFixed(1)
                    },
                    statusBreakdown,
                    departmentWiseBreakdown
                },
                message: "Manager report generated successfully"
            };
        } catch (error) {
            console.error("Error generating manager report:", error);
            return {
                status: false,
                data: null,
                message: "Failed to generate report"
            };
        }
    }

}


export default CommonServices;