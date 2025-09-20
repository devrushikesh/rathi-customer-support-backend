
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

}


export default CommonServices;