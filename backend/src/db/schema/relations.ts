import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

const relations = defineRelations(schema, (r) => ({
	// 	account: {
	// 		user: r.one.user({
	// 			from: r.account.userId,
	// 			to: r.user.id,
	// 		}),
	// 	},
}));

export const getRelations = () => ({
	relations: { ...relations, ...schema.authRelations },
});
