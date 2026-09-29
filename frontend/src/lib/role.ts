import { roleEnum } from "backend/auth";
import { snakeToTitleCase } from "./utils";

export const rolesObject = roleEnum.map((r) => ({
	value: r,
	label: snakeToTitleCase(r),
}));
