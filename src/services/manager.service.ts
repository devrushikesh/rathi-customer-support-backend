import prisma from "../prisma/client.js";



const get_new_issues = async () => {
    try {
        const issues = await prisma.issue.findMany({
            where: {
                
            }
        })
    } catch (error) {
        
    }
}