import { seed } from "drizzle-seed";
import { schema } from "@/db";
import { db } from "@/services";

await seed(db, { user: schema.user, teacher: schema.teacher });
