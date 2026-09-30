import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import z from "zod";

const CRUD = ["get", "list", "create", "update", "delete"] as const;
export type Actions = (typeof CRUD)[number];

const permissions = {
	scheduler: CRUD,
	student: CRUD,
	teacher: CRUD,
	qa_auditor: CRUD,
	enrollment_advisor: CRUD,
	slot: CRUD,
} as const;

export type Permissions = typeof permissions;
export type Sectors = keyof Permissions;

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
	slot: ["get", "list", "create", "update", "delete"],
});

const teacher = ac.newRole({
	student: ["update"],
	teacher: ["update"],
	slot: ["get", "list", "update"],
});

const enrollment_advisor = ac.newRole({
	user: ["create"],
	student: ["create"],
	enrollment_advisor: ["update"],
});

const student = ac.newRole({
	student: ["update"],
	slot: ["get", "list", "update"],
});

const qa_auditor = ac.newRole({
	slot: ["get", "list"],
});

export const roles = {
	admin,
	scheduler,
	teacher,
	enrollment_advisor,
	student,
	qa_auditor,
};

export type Role = keyof typeof roles | "user";
export const roleEnum = Object.keys(roles);
export const roleEnumZod = z.enum(roleEnum);
