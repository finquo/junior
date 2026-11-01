"use client";

import { RedirectType, redirect } from "next/navigation";

export default function () {
	return redirect("/teachers", RedirectType.replace);
}
