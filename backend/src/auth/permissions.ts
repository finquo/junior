import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const ac = createAccessControl({
	...defaultStatements,
	scheduler: ["create", "update", "delete"],
	student: ["create", "update", "delete"],
	teacher: ["create", "update", "delete"],
	qa_auditor: ["create", "update", "delete"],
	enrollment_advisor: ["create", "update", "delete"],
});

const admin = ac.newRole({
	...adminAc.statements,
	scheduler: ["create", "update", "delete"],
	student: ["create", "update", "delete"],
	teacher: ["create", "update", "delete"],
	qa_auditor: ["create", "update", "delete"],
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
