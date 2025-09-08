import type {
  Category,
  Priority,
  CustomerStatus,
  Issue,
  IssueTimeLine,
  Customer
} from "@prisma/client";
import prisma from "../prisma/client.js";

// Types for better type safety
interface CreateIssueData {
  description: string;
  projectId: number;
  customerId: number;
  attachmentUrls?: string[];
}

interface IssueWithCustomer extends Issue {
  customer: Customer;
}

interface IssueWithTimeline extends Issue {
  timeline: IssueTimeLine[];
}

class CustomerServices {

  static async createIssue(data: CreateIssueData) {
    try {
      const year = new Date().getFullYear();

      const result = await prisma.$transaction(async (tnx) => {
        // 1. Verify customer exists
        const customer = await tnx.customer.findUnique({
          where: { id: data.customerId }
        });

        if (!customer) {
          throw new Error(`Customer with ID ${data.customerId} not found`);
        }

        // 2. Count existing issues this year for ticket numbering
        const count = await tnx.issue.count({
          where: {
            createdAt: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`)
            }
          }
        });

        // 3. Generate next ticket number
        const nextNumber = count + 1;
        const ticketNo = `ISSUE-${year}-${String(nextNumber).padStart(3, '0')}`;

        const project = await prisma.projects.findFirst({
          where: {
            id: data.projectId,
            customer: {
              id: data.customerId
            }
          }
        });

        if (!project) {
          throw new Error("Project not exist");
        }

        // 4. Create the issue
        const newIssue = await tnx.issue.create({
          data: {
            description: data.description,
            projectId: data.projectId,
            customerId: data.customerId,
            ticketNo: ticketNo,
            attachmentUrls: data.attachmentUrls || []
          }
        });

        // 5. Create initial timeline entry
        const timelineEntry = await tnx.issueTimeLine.create({
          data: {
            issueId: newIssue.id,
            action: 'ISSUE_CREATED',
            toCustomerStatus: 'UNDER_REVIEW',
            toInternalStatus: 'NEW',
            visibleToCustomer: true,
            comment: "Issue Successfully Created. Our team review this issue soon."
          }
        });

        return {
          issue: newIssue,
          timeline: timelineEntry
        };
      });

      console.log("Issue created successfully:", result.issue.ticketNo);
      return {
        success: true,
        data: result.issue,
        message: `Issue ${result.issue.ticketNo} created successfully`
      };

    } catch (error) {
      console.error("Failed to create issue:", error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : "Failed to create issue"
      };
    }
  }

  static async fetchProjectsList(customerId: number) {
    try {
      const projects = await prisma.projects.findMany({
        where: {
          customerId: customerId
        },
        select: {
          id: true,
          projectName: true,
          createdAt: true
        }
      })
      return {
        status: true,
        data: projects,
        message: "Projects fetched Successfully!"
      }
    } catch (error) {
      return {
        status: true,
        data: null,
        message: "Error While fetching projects"
      }
    }
  }

  static async fetchActiveIssues(customerId: number) {
    try {
      const activeIssues = await prisma.issue.findMany({
        where: {
          customerId: customerId,
          customerStatus: {
            notIn: ['CLOSED', 'CANCELLED']
          }
        },
        select: {
          id: true,
          projectId: true,
          internalStatus: true,
          customerStatus: true,
          description: true,
          ticketNo: true,
          updatedAt: true,
          createdAt: true,
          isAttachmentsRequested: true,
          isSiteVisitRequested: true
        },
        orderBy: [
          { priority: 'desc' }, // High priority first
          { createdAt: 'desc' }  // Recent first
        ]
      });

      return {
        success: true,
        data: activeIssues,
        count: activeIssues.length,
        message: `Found ${activeIssues.length} active issues`
      };

    } catch (error) {
      console.error("Failed to fetch active issues:", error);
      return {
        success: false,
        data: [],
        count: 0,
        message: "Failed to fetch active issues"
      };
    }
  }

  static async fetchClosedIssues(customerId: number) {
    try {
      const closedIssues = await prisma.issue.findMany({
        where: {
          customerId: customerId,
          customerStatus: {
            in: ['CLOSED', 'CANCELLED']
          }
        },
        select: {
          id: true,
          projectId: true,
          internalStatus: true,
          customerStatus: true,
          description: true,
          ticketNo: true,
          createdAt: true,
          updatedAt: true,
          isAttachmentsRequested: true,
          isSiteVisitRequested: true
        },
        orderBy: {
          closedAt: 'desc' // Most recently closed first
        }
      });

      return {
        success: true,
        data: closedIssues,
        count: closedIssues.length,
        message: `Found ${closedIssues.length} closed issues`
      };

    } catch (error) {
      console.error("Failed to fetch closed issues:", error);
      return {
        success: false,
        data: [],
        count: 0,
        message: "Failed to fetch closed issues"
      };
    }
  }

  static async getProjectById(projectId: number, customerId: number) {
    try {
      const project = await prisma.projects.findFirst({
        where: {
          id: projectId,
          customerId: customerId,
        },
      });

      if (!project) {
        return {
          status: false,
          data: null,
          message: "Project not found",
        };
      }

      return {
        status: true,
        data: project,
        message: "Project fetched successfully",
      };
    } catch (error: any) {
      console.error("Error fetching project:", error);
      return {
        status: false,
        data: null,
        message: error.message || "Something went wrong while fetching project",
      };
    }
  }

  static async getIssueById(issueId: string, customerId: number) {
    try {
      const issue = await prisma.issue.findFirst({
        where: {
          id: issueId,
          customerId: customerId
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
            where: {
              visibleToCustomer: true
            },
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

export default CustomerServices;
