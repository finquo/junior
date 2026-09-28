import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import z from "zod";

const CRUD = ["get", "list", "create", "update", "delete"] as const;

const permissions = {
	user: CRUD,
	scheduler: CRUD,
	student: CRUD,
	teacher: CRUD,
	qa_auditor: CRUD,
	enrollment_advisor: CRUD,
} as const;

export type Permissions = typeof permissions;

export const ac = createAccessControl({
	...defaultStatements,
	...permissions,
});

const admin = ac.newRole({
	...adminAc.statements,
	...permissions,
});

const scheduler = ac.newRole({
	scheduler: ["update"],
	student: ["update", "delete"],
	teacher: ["update", "delete"],
});

const teacher = ac.newRole({
	student: ["update"],
	teacher: ["update"],
});

const enrollment_advisor = ac.newRole({
	user: ["create"],
	student: ["create"],
	enrollment_advisor: ["update"],
});

const student = ac.newRole({
	student: ["update"],
});

const qa_auditor = ac.newRole({});

export const roles = {
	admin,
	scheduler,
	teacher,
	enrollment_advisor,
	student,
	qa_auditor,
};

export type Role = keyof typeof roles;
export const roleEnum = Object.keys(roles);
export const roleEnumZod = z.enum(roleEnum);
