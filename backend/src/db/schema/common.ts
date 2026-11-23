import { pgEnum } from "drizzle-orm/pg-core";

export const answerStatusEnum = pgEnum("answer_status", [
	"pending",
	"answered",
	"correct",
	"partially_correct",
	"wrong",
	"retake",
]);
