import prisma from "../prisma/client.js";


// create issue service


async function createIssue(
    data: {
        title: string,
        description: string,
        machine: string,
        imageurl: string[],
        videourl: string[],
        createdBy: number
    }) {

    try {

        const Issue = await prisma.issue.create({
            data: {
                title: data.title,
                description: data.description,
                machine: data.machine,
                images: data.imageurl,
                videos: data.videourl,
                createdBy: data.createdBy
            }
        })

        console.log(Issue)

    } catch (error) {
        console.log(error);
    }


}