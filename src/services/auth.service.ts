import prisma from "../prisma/client.js";

class AuthService {
    static async check_user_exist(mobile_number: string) {
        try {
            const existingCustomer = await prisma.customer.findFirst({
                where: { mobile_no: mobile_number },
            });
            if (existingCustomer) {
                return true;
            }
            else {
                const existingEmployee = await prisma.employee.findFirst({
                    where: { mobile_no: mobile_number },
                });
                if (existingEmployee) {
                    return true;
                }
                else{
                    return false;
                }
            }
        } catch (error) {
            return false
        }
    }


    static async send_otp(mobile_number: string){
        try {
            if (!await this.check_user_exist(mobile_number)) {
                return "Invalid Mobile Number";
            }
            
        } catch (error) {
            
        }
    }
}