import type { Session } from "@/auth";
import type { Database } from "@/db";

export type Context = {
	session: Session | null;
	db: Database;
};
