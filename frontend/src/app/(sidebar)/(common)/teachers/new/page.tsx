"use client";

import { CreateUserForm } from "@/app/(sidebar)/admin/users/new/_components/create-user-form";

export default function Page() {
	return (
		<CreateUserForm
			title="Create New Teacher"
			description="Add a teacher account. Assign them to a scheduler from their profile."
			cancelHref="/teachers"
			defaultRole="teacher"
			lockRole
		/>
	);
}
