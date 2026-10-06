"use client";

import { useQuery } from "@tanstack/react-query";
import {
	columnFilteringFeature,
	columnVisibilityFeature,
	createColumnHelper,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFn_includesString,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_text,
	tableFeatures,
	useTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { Languages, type StudentType } from "backend/config";
import Loader from "@/components/loader";
import { ProfileCard, StudentProfile } from "@/components/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/hooks/api";
import { FetchUser } from "@/hooks/user";

const features = tableFeatures({
	columnFilteringFeature,
	columnVisibilityFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortedRowModel: createSortedRowModel(),
	filterFns: { includesString: filterFn_includesString },
	sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

type DataTableFeatures = typeof features;

const columnHelper = createColumnHelper<DataTableFeatures, StudentType>();

const columns: ColumnDef<DataTableFeatures, StudentType>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "student",
			header: "Student",
			cell: ({ row }) => (
				<FetchUser id={row.original.id} isPending={<Spinner />}>
					{(user) => (
						<Drawer>
							<DrawerTrigger
								render={
									<Item className="cursor-pointer p-0 text-left hover:opacity-80 transition-opacity" />
								}
							>
								<ItemMedia>
									<Avatar size="sm">
										<AvatarImage
											src={user.image ?? undefined}
											alt={user.name}
										/>
										<AvatarFallback>
											{user.name?.[0] ?? "U"}
										</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{user.name}</ItemTitle>
									<ItemDescription>{user.email}</ItemDescription>
								</ItemContent>
							</DrawerTrigger>
							<DrawerContent className="overflow-y-auto">
								<DrawerHeader>
									<DrawerTitle>{user.name}</DrawerTitle>
									<DrawerDescription>{user.email}</DrawerDescription>
								</DrawerHeader>
								<div className="flex flex-col gap-4 p-4">
									<ProfileCard user={user} />
									<StudentProfile student={row.original} />
								</div>
								<DrawerFooter>
									<DrawerClose render={<Button variant="outline" />}>
										Close
									</DrawerClose>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
					)}
				</FetchUser>
			),
		}),
		columnHelper.accessor("program", {
			header: "Program",
			cell: ({ getValue }) => getValue() ?? "—",
		}),
		columnHelper.accessor("schooling", {
			header: "Schooling",
			cell: ({ getValue }) => getValue() ?? "—",
		}),
		columnHelper.display({
			id: "languages",
			header: "Languages",
			cell: ({ row }) =>
				row.original.languages
					?.map((code) => Languages[code as keyof typeof Languages] ?? code)
					.join(", ") || "—",
		}),
		columnHelper.display({
			id: "lessons",
			header: "Lessons",
			cell: ({ row }) => row.original.lessons?.length ?? 0,
		}),
		columnHelper.accessor("meetingLink", {
			header: "Meeting",
			cell: ({ getValue }) => {
				const link = getValue();
				if (!link) return "—";
				return (
					<Button
						variant="outline"
						size="sm"
						render={<a href={link} target="_blank" rel="noreferrer" />}
					>
						Join
					</Button>
				);
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Joined",
			cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
		}),
	]);

export default function Page() {
	const { data: students = [], isPending } = useQuery(
		api.teacher.getStudents.queryOptions(),
	);

	const table = useTable({
		features,
		data: students,
		columns,
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<TableHead key={header.id}>
								{header.isPlaceholder ? null : (
									<table.FlexRender header={header} />
								)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows.length ? (
					table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									<table.FlexRender cell={cell} />
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className="text-center">
							No students found
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
