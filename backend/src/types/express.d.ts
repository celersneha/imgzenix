import type { HydratedDocument } from "mongoose";
import type { ApiKeyDocument } from "../models/api-key.model.js";
import type { UserDocument } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<UserDocument>;
      apiKey?: HydratedDocument<ApiKeyDocument>;
      authType?: "jwt" | "apiKey";
    }
  }
}

export {};
