import { createAuth } from "@/auth";
import { createDb } from "./db";

export const db = createDb();
export const auth = createAuth();
