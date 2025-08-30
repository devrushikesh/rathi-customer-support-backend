import type { Category, Priority } from "@prisma/client";
import prisma from "../prisma/client.js";

class CustomerServices {

    // create issue service

    static async createIssue(data: {
        description: string,
        machine: string,
        priority: Priority,
        location: string,
        category: Category,
        customerId: number
    }) {
        try {
            const year = new Date().getFullYear();
            const result = await prisma.$transaction(async (tnx) => {
                // 1. Count how many issues exist this year
                const count = await tnx.issue.count({
                    where: {
                        createdAt: {
                            gte: new Date(`${year}-01-01`)
                        }
                    }
                });
                // 2. Generate next ticket number
                const nextNumber = count + 1;
                const ticketNo = `ISSUE-${year}-${String(nextNumber).padStart(3, '0')}`;

                const newIssue = await tnx.issue.create({
                    data: {
                        description: data.description,
                        machine: data.machine,
                        priority: data.priority,
                        location: data.location,
                        customerId: data.customerId,
                        category: data.category,
                        ticketNo: ticketNo
                    }
                })

                const updated_time_line = await tnx.issueTimeLine.create({
                    data: {
                        issueId: newIssue.id,
                    }
                })
                return { newIssue, updated_time_line }
            });

            console.log("Transaction successful:", result);

        } catch (error) {
            console.log("Transaction failed:", error);
        }
    }

    static async fetchAllIssues(userId: number) {
        try {
            const Issues = prisma.issue.findMany({
                where: {
                    customerId: userId,
                }
            })
            return Issues;

        } catch (error) {
            return null;
        }
    }

    static async fetchIssueTimeline(issueId: string) {
        try {
            const Issue = prisma.issueTimeLine.findMany({
                where: {
                    issueId: issueId
                }
            })
            console.log(Issue);

            return Issue
        } catch (error) {
            console.log(error);

            return null
        }
    }

}



export default CustomerServices