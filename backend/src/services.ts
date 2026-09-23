import { createAuth } from "@/auth";
import { createBetterDb } from "@/db";

import { ENV } from "./env.server";

export const auth = createAuth(ENV);
export const db = createBetterDb(ENV);
