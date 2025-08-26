import prisma from "../prisma/client.js";


// create issue service

export async function createIssue(data: {
    title: string,
    description: string,
    machine: string,
    images: string[],
    videos: string[],
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
                    description: "Production line A completely down. Motor failure suspected.",
                    machine: "CRUSHER",
                    priority: "CRITICAL",
                    location: "At Beed near sandhavi station 442232",
                    customerId: data.customerId,
                    category: "MAINTENANCE",
                    ticketNo: ticketNo
                }
            })

            const updated_time_line = await tnx.issueTimeLine.create({
                data: {
                    issueId: newIssue.id,
                    
                }
            })
        });

        console.log("Transaction successful:", result);

    } catch (error) {
        console.log("Transaction failed:", error);
    }
}

export async function fetchAllIssues(userId: number) {
    try {
        const Issues = prisma.issue.findMany({
            where: {
                createdBy: userId,
            }
        })
        return Issues;

    } catch (error) {
        return null;
    }
}

export async function fetchIssueTimeline(issueId: number) {
    try {
        const Issue = prisma.issueTimeLine.findMany({
            where: {
                id: "issueId"
            }
        })
        console.log(Issue);

        return Issue
    } catch (error) {
        console.log(error);

        return null
    }
}

