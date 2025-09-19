
import prisma from "../prisma/client.js";
import { generate_jwt_token, verify_jwt_token, type JwtPayload } from "../utils/jwt.js";
import otpCache from "./store.service.js";

class AuthService {


    static async getNewAccessToken(refreshToken: string): Promise<{ status: boolean, message: string, accessToken: { token: string; expiresAt: number } | null }> {
        try {
            console.log("Refresh Token:", refreshToken);
            
            const verified = verify_jwt_token<string | number>(refreshToken, "refresh");
            if (!verified) {
                return {
                    status: false,
                    message: "Invalid or expired token",
                    accessToken: null
                }
            }

            const payload: JwtPayload<string | number> = {
                id: verified.id,
                role: verified.role,
                department: verified.department
            }
            const accessToken = generate_jwt_token(payload, "access");
            if (!accessToken) {
                return {
                    status: false,
                    message: "Something wrong!",
                    accessToken: null
                }
            }

            return {
                status: true,
                message: "Successfully generated new access token",
                accessToken: accessToken
            }

        } catch (error) {
            return {
                status: false,
                message: "Internal Server Error!",
                accessToken: null
            }
        }
    }

    static async check_user_exist(mobile_number: string) {
        try {
            const existingCustomer = await prisma.customer.findFirst({
                where: { mobile_no: mobile_number },
            });
            if (existingCustomer) {
                return {
                    status: true,
                    role: existingCustomer.role
                };
            }
            else {
                const existingEmployee = await prisma.employee.findFirst({
                    where: { mobile_no: mobile_number },
                });
                if (existingEmployee) {
                    return {
                        status: true,
                        role: existingEmployee.role
                    };
                }
                else {
                    return {
                        status: false,
                        role: null
                    };
                }
            }
        } catch (error) {
            return {
                status: false,
                role: null
            }
        }
    }

    static async send_otp(mobile_number: string) {

        try {

            const user = await this.check_user_exist(mobile_number)

            console.log(user);
            

            if (!user.status ) {
                return {
                    status: false,
                    message: "User Does not Exist",
                    request_id: null
                };
            }
            const request_id = "lkasuasfklajsf";

            otpCache.set(request_id, { mobile_number, role: user.role, attempts: 0 });

            return {
                status: true,
                message: "Otp Sent Successfully",
                request_id: request_id
            }

        } catch (error) {
            return {
                status: false,
                message: "Server Issue: unable to send otp",
                request_id: null
            }
        }
    }

    static async verify_otp(request_id: string, otp: number) {
        try {
            const data: {role: string, mobile_number:string} | undefined = otpCache.get(request_id);

            if (!data) {
                return {
                    status: false,
                    message: "Invalid Request",
                    data: null
                }
            }

            // TO-DO -> otp verification logic
            if (otp != 123456) {
                return {
                    status: false,
                    message: "Invalid Otp",
                    data: null
                }
            }

            let user;

            if (data.role == "CUSTOMER") {
                user = await prisma.customer.findUnique({
                    where: {
                        mobile_no: data.mobile_number 
                    }
                })
            }
            else{
                user = await prisma.employee.findUnique({
                    where: {
                        mobile_no: data.mobile_number 
                    }
                })
            }

            if (!user) {
                return {
                    status: false,
                    message: "Something went Wrong!",
                    data: null
                }
            }
            const department = user.role == "CUSTOMER" || user.role == "ISSUE_MANAGER" ? null: user.department;

            const payload: JwtPayload<string | number> = {
                id: user.id,
                role: data.role,
                department: department
            }
            const accessToken = generate_jwt_token(payload, "access");
            const refreshToken = generate_jwt_token(payload, "refresh");

            if (!accessToken || !refreshToken) {
                return {
                    status: false,
                    message: "Something wrong!",
                    data: null
                }
            }

            return {
                status: true,
                message: "Successfully Otp Verified!",
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    role: data.role,
                    department: department
                }
            }

        } catch (error) {
            return {
                status: false,
                message: "Internal Server Error!",
                data: null
            }
        }
    }

}


export default AuthService