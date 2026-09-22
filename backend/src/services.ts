import { createAuth } from "@/auth";
import { createDb } from "@/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
