// auth.ts
import jwt from "jsonwebtoken";
import { SECRETE_KEY } from "../config.js";

export interface JwtPayload<T extends string | number = string> {
  id: T;
  role: string;
  department?: string | null;
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

export function generate_jwt_token<T extends string | number = string>(payload: JwtPayload<T>): string | null {
  try {
    // basic runtime checks
    if (!SECRETE_KEY) {
      console.error("Missing SECRETE_KEY");
      return null;
    }
    if (payload == null || payload.id == null || payload.role == null) {
      console.error("Invalid payload: id, role and isCustomer are required");
      return null;
    }

    // sign token (explicit algorithm)
    const token = jwt.sign(payload as object, SECRETE_KEY, {
      expiresIn: "1d",
      algorithm: "HS256"
    });

    return token;
  } catch (err) {
    console.error("generate_jwt_token error:", err);
    return null;
  }
}

/**
 * Verify token and return typed JwtPayload<T> or null.
 * Safe: checks runtime shape; does not throw to caller (returns null on any problem).
 */
export function verify_jwt_token<T extends string | number = string>(token: string): JwtPayload<T> | null {
  try {
    if (!SECRETE_KEY) {
      console.error("Missing SECRETE_KEY");
      return null;
    }
    if (!token) return null;

    const decoded = jwt.verify(token, SECRETE_KEY, { algorithms: ["HS256"] });

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
