"use client";

import { CreateUserForm } from "@/app/(sidebar)/admin/users/new/_components/create-user-form";

export default function Page() {
	return (
		<CreateUserForm
			title="Create New Scheduler"
			description="Add a scheduler who will manage teachers and students."
			cancelHref="/schedulers"
			defaultRole="scheduler"
			lockRole
		/>
	);
}
