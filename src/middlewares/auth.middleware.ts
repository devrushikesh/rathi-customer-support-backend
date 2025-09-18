// src/middleware/auth.ts
import { type Request, type Response, type NextFunction } from "express";
import { verify_jwt_token } from "../utils/jwt.js"; // adjust path if needed
import type { JwtPayload } from "../utils/jwt.js";  // ensure this type is exported

class AuthMiddleware {
    /**
     * Attach verified JWT payload to req.user (or return 401).
     * Supports Authorization: Bearer <token> and custom header authtoken.
     */
    static AuthenticateUser(req: Request, res: Response, next: NextFunction) {
        try {
            
            // Express headers are lower-cased. Support both Authorization and custom header.
            const authHeader = (req.headers.authorization as string | undefined) ?? undefined;

            // Prefer Bearer token if provided
            let token: string | undefined;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.slice(7).trim();
            } else {
                return res.status(401).json({ error: "Missing token" });
            }

            if (!token) {
                return res.status(401).json({ error: "Missing token" });
            }

            // verify_jwt_token should return JwtPayload<string|number> | null
            const verified = verify_jwt_token<string | number>(token, "access");
            if (!verified) {
                return res.status(401).json({ error: "Invalid or expired token" });
            }


            // attach to req.user (your global express type must allow this)
            req.user = {
                id: verified.id,
                role: verified.role,
                department: verified.department
            } as JwtPayload<string | number>;

            // all good — continue
            return next();
        } catch (err) {
            // Log if you want: console.error(err)
            return res.status(401).json({ error: "Unauthorized" });
        }
    }


    static AuthorizeUsers(
        allowedRoles: string | string[],
    ) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const user = req.user as JwtPayload<string> | JwtPayload<number> | undefined | null;
                if (!user) {
                    return res.status(401).json({ error: "Unauthorized" });
                }
                if (roles.includes(String(user.role))) {
                    return next();
                }
                return res.status(403).json({ error: "Forbidden" });
            } catch (err) {
                console.error("AuthorizeUsers error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
        };
    }

}

export default AuthMiddleware;
