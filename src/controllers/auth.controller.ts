import type { Request, Response } from "express";
import AuthService from "../services/auth.service.js";
import { access } from "node:fs";


export const getOtpAuthController = async (req: Request<{}, {}, { mobile_number: string }>, res: Response) => {
    const { mobile_number } = req.body;

    console.log(mobile_number);
    

    try {
        if (!mobile_number) {
            return res.status(400).send({
                status: false,
                message: "Invalid mobile Number",
                data: null
            })
        }
        const result = await AuthService.send_otp(mobile_number);
        return res.send({
            status: result.status,
            message: result.message,
            data: {
                request_id: result.request_id
            }
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: "Internal Server Error",
            data: null
        })
    }
}


export const verifyOtpAuthController = async (req: Request, res: Response) => {
    const {request_id, otp} = req.body;
    if (!request_id || !otp) {
        return res.status(400).json({
            status: false,
            message: "Invalid Request",
            data: null
        })
    }
    try {
        const result = await AuthService.verify_otp(request_id, otp);
        if (!result.status) {
            return res.status(500).json({
                status: false,
                message: result.message,
                data: null
            })
        }

        return res.json({
            status: result.status,
            message: result.message,
            data: {
                accessToken: result.data?.accessToken,
                refreshToken: result.data?.refreshToken,
                role: result.data?.role,
                department: result.data?.department
            }
        })
    } catch (error) {
        return res.status(500).json({
                status: false,
                message: "Internal Server Error!",
                data: null
            })
    }
}


export const verifyTokenAuthController = async (req: Request, res: Response) => {
    try {
        return res.json({
            status: true,
            message: "Token verified Successfully!",
            data: {
                id: req.user.id,
                role: req.user.role,
                department: req.user.department
            }
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Invalid Token",
            data: null
        })
    }
}



