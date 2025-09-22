
import prisma from "../prisma/client.js";
import { sendPushNotification } from "./firebase.service.js";
import { generateMultiplePresignedPostUrls, moveFolder } from "./s3.service.js";

import { randomUUID } from "crypto";

// Types for better type safety
interface CreateIssueData {
  description: string;
  projectId: number;
  customerId: number;
  attachmentUrls?: string[];
  tempId?: string
}


interface FileItem {
  fileName: string;
  contentType: string;
}

class CustomerServices {

  static async confirmOnRequestAttachmentsUploaded(issueId: string, tempId: string, customerID: number) {
    try {
      // 1️⃣ Check if issue exists and is expecting attachments
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: { ticketNo: true, isAttachmentsRequested: true, attachmentsRequestedByID: true },
      });

      if (!issue) {
        return { status: false, data: null, message: "Issue not found" };
      }

      if (!issue.isAttachmentsRequested) {
        return {
          status: false,
          data: null,
          message: "Attachments not requested for this issue",
        };
      }



      // 2️⃣ Move files first (external S3 action – do outside transaction)
      const movedFiles = await moveFolder(
        "rathi-engineering-issues",
        `temp/${tempId}/`,
        `issues/${issue.ticketNo}/`
      );

      if (!movedFiles || movedFiles.length === 0) {
        return {
          status: false,
          data: null,
          message: "No files were moved. Please check the tempId and try again.",
        };
      }

      // 3️⃣ Create timeline + update issue atomically
      const result = await prisma.$transaction(async (tx) => {


        const customer = await tx.customer.findUnique({
          where: {
            id: customerID
          },
          select: {
            name: true
          }
        })

        if (!customer) {
          throw new Error("Invalid request");
        }
        // create timeline entry
        const timeline = await tx.issueTimeLine.create({
          data: {
            issueId,
            action: "ATTACHMENT_ADDED",
            toCustomerStatus: null,
            toInternalStatus: null,
            visibleToCustomer: true,
            comment: `Customer has uploaded ${movedFiles.length} attachment(s).`,
          },
        });

        // update issue
        const updatedIssue = await tx.issue.update({
          where: { id: issueId },
          data: {
            attachmentUrls: { push: movedFiles },
            isAttachmentsRequested: false,
            attachmentsRequestedByID: null,
            latestStatusId: timeline.id,
          },
        });



        // send notification to manager
        const fcmToken = await tx.deviceToken.findFirst({
          where: {
            userId: issue.attachmentsRequestedByID!.toString()
          },
          select: {
            token: true
          }
        });
        console.log(fcmToken);

        if (fcmToken) {

          sendPushNotification(fcmToken.token, {
            title: "Attachments Succesfully Added!",
            body: `${customer.name} uploaded attachments for ticket No: ${issue.ticketNo}.\n tap to view details.`
          }, {
            action: 'OPEN_TICKET_DETAIL_PAGE',
            issueId: issueId
          });
        }

        return { timeline, updatedIssue };
      });

      return {
        status: true,
        data: movedFiles,
        message: "Attachments uploaded and issue updated successfully",
      };
    } catch (error) {
      console.error("confirmOnRequestAttachmentsUploaded error:", error);
      return {
        status: false,
        data: null,
        message: "Unable to confirm attachments upload",
      };
    }
  }



  static async getPresignedPutUrlsBehalfOfRequest(files: Array<FileItem>, issueId: string, userId: number) {
    try {
      const issue = await prisma.issue.findUnique({
        where: { id: issueId, customerId: userId },
        select: { ticketNo: true, isAttachmentsRequested: true }
      });

      if (!issue) {
        return {
          status: false,
          data: null,
          message: "Issue not found"
        };
      }

      if (!issue.isAttachmentsRequested) {
        return {
          status: false,
          data: null,
          message: "Attachments not requested for this issue"
        };
      }

      if (files.length === 0) {
        return {
          status: false,
          data: null,
          message: "No files provided"
        };
      }

      if (files.length > 5) {
        return {
          status: false,
          data: null,
          message: "Too many files provided"
        };
      }

      const tempId = randomUUID();
      const presignedUrls = await generateMultiplePresignedPostUrls(
        files,
        tempId
      );

      return {
        status: true,
        data: {
          presignedUrls,
          tempId
        },
        message: "successfully created presigned urls"
      };

    } catch {
      return {
        status: false,
        data: null,
        message: "unable to create presigned urls"
      };
    }
  }

  static async getPresignedPurUrls(files: Array<FileItem>) {
    try {
      const tempId = randomUUID();
      const presignedUrls = await generateMultiplePresignedPostUrls(files, tempId);

      return {
        status: true,
        data: {
          presignedUrls,
          tempId
        },
        message: "successfully created presigned urls"
      }

    } catch {
      return {
        status: false,
        data: null,
        message: "unable to create presigned urls"
      };
    }
  }


  static async createIssue(data: CreateIssueData) {
    console.log(data);

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
        const ticketNo = `${year}-${String(nextNumber).padStart(3, '0')}`;

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

        const movedFiles = await moveFolder(
          "rathi-engineering-issues",
          `temp/${data.tempId}/`,
          `issues/${ticketNo}/`
        );

        // 4. Create the issue
        const newIssue = await tnx.issue.create({
          data: {
            description: data.description,
            projectId: data.projectId,
            customerId: data.customerId,
            ticketNo: ticketNo,
            attachmentUrls: movedFiles || []
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
        const managerID = await tnx.employee.findFirst({
          where: {
            role: 'ISSUE_MANAGER'
          },
          select: {
            id: true
          }
        })

        if (!managerID) {
          throw new Error("No manager found to assign the issue");
        }

        // send notification to manager
        const managerToken = await tnx.deviceToken.findFirst({
          where: {
            userId: managerID.id
          },
          select: {
            token: true
          }
        });
        console.log(managerToken);

        if (managerToken) {

          sendPushNotification(managerToken.token, {
            title: "New Issue Created",
            body: `${customer.name} raised issue: ${newIssue.ticketNo}.\n tap to view details.`
          }, {
            action: 'OPEN_TICKET_DETAIL_PAGE',
            issueId: newIssue.id
          });
        }

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
