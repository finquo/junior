import { seed } from "drizzle-seed";
import { schema } from "@/db";
import { db } from "@/services";

await seed(db, {
	user: schema.user,
	session: schema.session,
	account: schema.account,
	verification: schema.verification,
	scheduler: schema.scheduler,
	teacher: schema.teacher,
	student: schema.student,
	payment: schema.payment,
	program: schema.program,
	lesson: schema.lesson,
	answer: schema.answer,
	material: schema.material,
	slot: schema.slot,
	slotLog: schema.slotLog,
}).refine((f) => ({
	user: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	session: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	account: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	verification: {
		count: 1,
		columns: { id: f.default({ defaultValue: "demo" }) },
	},
	scheduler: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	teacher: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	student: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	payment: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	program: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	lesson: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	answer: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	material: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	slot: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
	slotLog: { count: 1, columns: { id: f.default({ defaultValue: "demo" }) } },
}));

process.exit();
