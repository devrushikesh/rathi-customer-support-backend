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
  priority: Priority;
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

  /**
   * Create a new issue for a customer
   */
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
            priority: data.priority,
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
            toCustomerStatus: 'OPEN',
            toInternalStatus: 'NEW',
            visibleToCustomer: true,
            comment: "Issue Successfully Created."
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

  static async fetchProjectsList(customerId: number){
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

  /**
   * Fetch all active issues for a customer (not closed/cancelled)
   */
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
          createdAt: true,
          priority: true
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

  /**
   * Fetch all closed issues for a customer
   */
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
          priority: true
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

  /**
   * Fetch all issues for a customer (both active and closed)
   */
  static async fetchAllIssues(customerId: number) {
    try {
      const allIssues = await prisma.issue.findMany({
        where: {
          customerId: customerId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          {
            customerStatus: 'asc' // Active issues first
          },
          {
            createdAt: 'desc'
          }
        ]
      });

      // Separate active and closed for better organization
      const activeIssues = allIssues.filter(issue =>
        !['CLOSED', 'CANCELLED'].includes(issue.customerStatus)
      );
      const closedIssues = allIssues.filter(issue =>
        ['CLOSED', 'CANCELLED'].includes(issue.customerStatus)
      );

      return {
        success: true,
        data: {
          all: allIssues,
          active: activeIssues,
          closed: closedIssues
        },
        count: {
          total: allIssues.length,
          active: activeIssues.length,
          closed: closedIssues.length
        },
        message: `Found ${allIssues.length} total issues (${activeIssues.length} active, ${closedIssues.length} closed)`
      };

    } catch (error) {
      console.error("Failed to fetch all issues:", error);
      return {
        success: false,
        data: { all: [], active: [], closed: [] },
        count: { total: 0, active: 0, closed: 0 },
        message: "Failed to fetch issues"
      };
    }
  }


  /**
   * Get a single issue by ID (only if it belongs to the customer)
   */
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
              email: true
            }
          },
          timeline: {
            where: {
              visibleToCustomer: true
            },
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

  /**
   * Get customer's issue statistics
   */
  static async getIssueStats(customerId: number) {
    try {
      const [totalCount, activeCount, closedCount] = await Promise.all([
        prisma.issue.count({
          where: { customerId }
        }),
        prisma.issue.count({
          where: {
            customerId,
            customerStatus: { notIn: ['CLOSED', 'CANCELLED'] }
          }
        }),
        prisma.issue.count({
          where: {
            customerId,
            customerStatus: { in: ['CLOSED', 'CANCELLED'] }
          }
        }),
      ]);

      return {
        success: true,
        data: {
          total: totalCount,
          active: activeCount,
          closed: closedCount
        },
        message: "Statistics retrieved successfully"
      };

    } catch (error) {
      console.error("Failed to fetch issue statistics:", error);
      return {
        success: false,
        data: {
          total: 0,
          active: 0,
          closed: 0,
          critical: 0
        },
        message: "Failed to fetch statistics"
      };
    }
  }

  /**
   * Search issues by various criteria
   */
  static async searchIssues(customerId: number, searchParams: {
    query?: string;
    status?: CustomerStatus[];
    priority?: Priority[];
    category?: Category[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const {
        query,
        status,
        priority,
        category,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0
      } = searchParams;

      const whereClause: any = {
        customerId: customerId
      };

      // Text search in description, machine, or location
      if (query) {
        whereClause.OR = [
          { description: { contains: query, mode: 'insensitive' } },
          { machine: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { ticketNo: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Filter by status
      if (status && status.length > 0) {
        whereClause.customerStatus = { in: status };
      }

      // Filter by priority
      if (priority && priority.length > 0) {
        whereClause.priority = { in: priority };
      }

      // Filter by category
      if (category && category.length > 0) {
        whereClause.category = { in: category };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const [issues, totalCount] = await Promise.all([
        prisma.issue.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        prisma.issue.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: issues,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        message: `Found ${issues.length} issues matching your search`
      };

    } catch (error) {
      console.error("Failed to search issues:", error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
          hasMore: false
        },
        message: "Failed to search issues"
      };
    }
  }
}

export default CustomerServices;
