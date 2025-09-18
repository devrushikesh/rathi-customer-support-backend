// auth.ts
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET_KEY,REFRESH_TOKEN_SECRET_KEY } from "../config.js";

export interface JwtPayload<T extends string | number = string> {
  id: T;
  role: string;
  department?: string | null | undefined;
}

// Runtime type guard
function isJwtPayload<T extends string | number = string>(obj: unknown): obj is JwtPayload<T> {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as any;
  return (
    (o.id !== undefined) &&
    (typeof o.role === "string")
  );
}

export function generate_jwt_token<T extends string | number = string>(payload: JwtPayload<T>, mode: "access" | "refresh"): { token: string; expiresAt: number } | null {
  try {

    const TOKEN_SECRET_KEY = mode==="access"?ACCESS_TOKEN_SECRET_KEY:REFRESH_TOKEN_SECRET_KEY;
    // basic runtime checks
    if (!TOKEN_SECRET_KEY) {
      console.error("Missing SECRET_KEY");
      return null;
    }

    if (payload == null || payload.id == null || payload.role == null) {
      console.error("Invalid payload: id, role and isCustomer are required");
      return null;
    }
        // Set lifetime per mode
    const lifetime = mode === "access" ? "1m" : "7d";

    // sign token (explicit algorithm)
    const token = jwt.sign(payload as object, TOKEN_SECRET_KEY, {
      expiresIn: lifetime,
      algorithm: "HS256"
    });
    const expiresAt = Date.now() + msToMilliseconds(lifetime);

    return { token, expiresAt };
  } catch (err) {
    console.error("generate_jwt_token error:", err);
    return null;
  }
}


function msToMilliseconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const valueStr = match[1];
  if (typeof valueStr !== "string") return 0;
  const value = parseInt(valueStr, 10);
  const unit = match[2] as keyof typeof multipliers;
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}


export function verify_jwt_token<T extends string | number = string>(token: string, mode: "access" | "refresh"): JwtPayload<T> | null {
  try {
    const TOKEN_SECRET_KEY = mode==="access"?ACCESS_TOKEN_SECRET_KEY:REFRESH_TOKEN_SECRET_KEY;
    // basic runtime checks
    if (!TOKEN_SECRET_KEY) {
      console.error("Missing SECRET_KEY");
      return null;
    }
    if (!token) return null;

    const decoded = jwt.verify(token, TOKEN_SECRET_KEY, { algorithms: ["HS256"] });

    // jwt.verify can return string or object. Validate shape.
    if (typeof decoded === "string") {
      // rarely used: tokens can be signed as strings — treat as invalid here
      return null;
    }

    if (isJwtPayload<T>(decoded)) {
      // At this point it's safe to return typed payload
      return decoded;
    }

    // If shape mismatch, return null (or optionally throw)
    console.warn("Token decoded but payload shape invalid:", decoded);
    return null;
  } catch (err) {
    // token expired/invalid etc.
    // You can inspect err.name to handle 'TokenExpiredError' differently if desired
    // console.warn("verify_jwt_token error:", err);
    return null;
  }
}
