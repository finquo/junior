"use client";

import { CreateUserForm } from "@/app/(sidebar)/admin/users/new/_components/create-user-form";

export default function Page() {
	return (
		<CreateUserForm
			title="Create New Student"
			description="Add a student account. Assign their mentor and supervisor from their profile."
			cancelHref="/students"
			defaultRole="student"
			lockRole
		/>
	);
}
