import prisma from "../prisma/client.js";

class ManagerServices {
    
    static async getAllIssuesByStatus(status:string, managerId: string){
        try {
            
            await prisma.issue.findMany({
                where:{
                    
                }
            })

        } catch (error) {
            
        }
    }

}