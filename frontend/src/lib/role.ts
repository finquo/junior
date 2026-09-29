import { roleEnum } from "backend/config";
import { snakeToTitleCase } from "./utils";

export const rolesObject = roleEnum.map((r) => ({
	value: r,
	label: snakeToTitleCase(r),
}));
