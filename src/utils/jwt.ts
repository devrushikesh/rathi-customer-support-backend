import jwt from "jsonwebtoken";
import { SECRETE_KEY } from "../config.js";


function generate_jwt_token(user: { id: number, mobile_no: number }) {
    try {
        if (SECRETE_KEY == null || user.id == null || user.mobile_no == null) {
            return console.error("Could not found Secrete key...");
        }
        const token: string = jwt.sign(user, SECRETE_KEY, { expiresIn: '1d' })
        return token;
    } catch (error) {
        return null
    }
}