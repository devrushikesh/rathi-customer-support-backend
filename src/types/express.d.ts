// types/express.d.ts
import type { JwtPayload } from "../utils/jwt"; // no .ts extension

declare global {
  namespace Express {
    // use a concrete id type (string here). Use whatever your JWT id type is.
    interface Request {
      user?: JwtPayload<string | number> | null;
    }
  }
}

export {};