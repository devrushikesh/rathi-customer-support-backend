import prisma from "../prisma/client.js";


class ManagerServices {

    static get_new_issues = async () => {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    status: "OPEN"
                }
            })

            console.log(issues);
            return issues;

        } catch (error) {
            return null;
        }
    }

    static get_all_issues = async () => {
        try {
            const issues = await prisma.issue.findMany({
                where: {
                    NOT: {
                        status: "OPEN"
                    },
                },
            })

            console.log(issues);
            return issues;

        } catch (error) {
            return null;
        }
    }

    static assign_issue = async (
        issue_id: string,
        assign_to: string,
        manager_id: string
    ) => {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Check if issue exists and is OPEN
                const issue = await tx.issue.findUnique({
                    where: { id: issue_id },
                });

                if (!issue || issue.status !== "OPEN") {
                    throw new Error("Issue not found or not open");
                }

                // 2. Check if assigned user exists
                const employee = await tx.employee.findUnique({
                    where: { id: assign_to },
                });

                if (!employee) {
                    throw new Error("Assigned employee does not exist");
                }

                // 3. Update issue
                const updated_issue = await tx.issue.update({
                    where: { id: issue_id },
                    data: {
                        status: "IN_PROGRESS",
                        assignedToId: assign_to,
                    },
                });

                // 4. Add timeline entry
                await tx.issueTimeLine.create({
                    data: {
                        issueId: issue_id,
                        action: "ASSIGNED",
                        fromStatus: "OPEN",
                        toStatus: "IN_PROGRESS",
                        toEmployeeId: assign_to,
                        performedById: manager_id
                    },
                });
                await tx.issueTimeLine.create({
                    data: {
                        issueId: issue_id,
                        action: "ASSIGNED",
                        fromStatus: "OPEN",
                        toStatus: "IN_PROGRESS",
                        toEmployeeId: assign_to,
                        performedById: manager_id
                    }
                })

                return updated_issue;
            });

            return result;
        } catch (error) {
            console.error(error);
            return null;
        }
    };


}


export default ManagerServices