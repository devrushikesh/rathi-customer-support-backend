import prisma from "../prisma/client.js";

class CommonServices {
    /**
 * Fetch timeline for a specific issue (only if it belongs to the customer)
 */
    static async fetchIssueTimelineForCustomer(issueId: string, customerId: number) {
        try {

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    customerId: customerId,
                }
            });

            if (!issue) {
                return {
                    success: false,
                    data: [],
                    message: "Issue not found or access denied"
                };
            }

            // Fetch timeline entries visible to customer
            const timeline = await prisma.issueTimeLine.findMany({
                where: {
                    issueId: issueId,
                    visibleToCustomer: true
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
                }
            });

            return {
                success: true,
                data: timeline,
                count: timeline.length,
                message: `Found ${timeline.length} timeline entries for issue ${issue.ticketNo}`
            };

        } catch (error) {
            console.error("Failed to fetch issue timeline:", error);
            return {
                success: false,
                data: [],
                message: "Failed to fetch issue timeline"
            };
        }
    }


    static async fetchIssueTimelineForHead(issueId: string, employeeId: string) {
        try {

            const issue = await prisma.issueAssignedDepartment.findFirst({
                where: {
                    issueId: issueId,
                    employeeId: employeeId
                }
            });

            if (!issue) {
                return {
                    success: false,
                    data: [],
                    message: "Issue not found or access denied"
                };
            }

            // Fetch timeline entries visible to customer
            const timeline = await prisma.issueTimeLine.findMany({
                where: {
                    issueId: issueId
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
                }
            });

            return {
                success: true,
                data: timeline,
                count: timeline.length,
                message: `Found ${timeline.length} timeline entries for issue ${issueId}`
            };

        } catch (error) {
            console.error("Failed to fetch issue timeline:", error);
            return {
                success: false,
                data: [],
                message: "Failed to fetch issue timeline"
            };
        }
    }

    static async fetchIssueTimelineForManager(issueId: string) {
        try {
            const timeline = await prisma.issueTimeLine.findMany({
                where: {
                    id: issueId
                },
                orderBy: {
                    createdAt: 'asc' // Chronological order
                }
            })
            return {
                success: true,
                data: timeline,
                count: timeline.length,
                message: `Found ${timeline.length} timeline entries for issue ${issueId}`
            };

        } catch (error) {
            return {
                success: true,
                data: null,
                message: `Internal Error while getting timeline data`
            };
        }
    }

}


export default CommonServices;