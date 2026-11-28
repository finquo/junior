"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { Details } from "./_components/details";
import { SummaryView } from "./_components/summary";
import { Timeline } from "./_components/timeline";

export default function Page() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:w-5xl xl:w-7xl">
			<div className="col-span-1 space-y-4">
				<LoadQuery
					label="Course Details"
					api={api.student.getCourseMeta.queryOptions()}
				>
					{(course) => <Details course={course} />}
				</LoadQuery>
				<LoadQuery
					label="Course Summary"
					api={api.student.getCourseVideoGroups.queryOptions()}
					wrapper={(children) => (
						<Card>
							<CardHeader>
								<CardTitle>Course Summary</CardTitle>
								<CardDescription>
									Modules and videos in the order you can watch
								</CardDescription>
							</CardHeader>
							<CardContent>{children}</CardContent>
						</Card>
					)}
				>
					{(modules) => <SummaryView modules={modules} />}
				</LoadQuery>
			</div>
			<div className="col-span-2">
				<LoadQuery
					label="Course Timeline"
					api={api.student.getCourseVideoGroups.queryOptions()}
					wrapper={(children) => (
						<Card>
							<CardHeader>
								<CardTitle>Course Modules</CardTitle>
								<CardDescription>
									Modules and videos in the order you can watch
								</CardDescription>
							</CardHeader>
							<CardContent>{children}</CardContent>
						</Card>
					)}
				>
					{(modules) => <Timeline modules={modules} />}
				</LoadQuery>
			</div>
		</div>
	);
}
