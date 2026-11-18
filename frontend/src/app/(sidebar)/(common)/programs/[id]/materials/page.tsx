"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
	ArrowLeftIcon,
	MoreHorizontalIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sileo as toast } from "sileo";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { FetchLesson } from "@/hooks/lesson";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { AddProgramMaterialDialog } from "./_components/add-material-dialog";

type ProgramMaterialRecord =
	API_Returns["core"]["program"]["materials"][number];

function DeleteMaterialDialog({
	programId,
	materialId,
	children,
}: {
	programId: string;
	materialId: string;
	children: React.ReactElement;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete material?</AlertDialogTitle>
					<AlertDialogDescription>
						This will remove the material from this program. This cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={api.core.program.removeMaterial.mutationOptions({
							onSuccess: () => {
								refetchAPIs([
									api.core.program.materials.queryKey({
										input: { id: programId },
									}),
									api.core.program.get.queryKey({ input: { id: programId } }),
								]);
								toast.success({ title: "Material deleted" });
							},
						})}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate({ id: programId, materialId })}
							>
								<Trash2Icon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive" disabled>
								<Spinner />
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const columnHelper = createColumnHelper<
	DataTableFeatures,
	ProgramMaterialRecord
>();

const createColumns = (programId: string) =>
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Material" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Material",
				placeholder: "Search materials...",
				variant: "text",
			},
			cell: ({ getValue }) => getValue(),
		}),
		columnHelper.accessor("lessons", {
			id: "lessons",
			header: () => "Lessons",
			enableSorting: false,
			cell: ({ getValue }) =>
				getValue().map((lessonId) => (
					<Badge key={lessonId} variant="outline">
						<FetchLesson
							id={lessonId}
							isPending={<Skeleton className="h-4 w-24" />}
						>
							{(lesson) => lesson.name}
						</FetchLesson>
					</Badge>
				)),
		}),
		columnHelper.accessor("materialCount", {
			id: "materialCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Materials Created" />
			),
			enableSorting: true,
			meta: { label: "Materials Created", variant: "number" },
			cell: ({ getValue }) => getValue(),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<MoreHorizontalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DeleteMaterialDialog
							programId={programId}
							materialId={row.original.id}
						>
							<DropdownMenuActionItem variant="destructive">
								<Trash2Icon />
								Delete Material
							</DropdownMenuActionItem>
						</DeleteMaterialDialog>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		}),
	]);

function ProgramMaterials({ programId }: { programId: string }) {
	const { data: program } = useQuery(
		api.core.program.get.queryOptions({ input: { id: programId } }),
	);
	const { data = [], isPending } = useQuery(
		api.core.program.materials.queryOptions({ input: { id: programId } }),
	);

	const columns = createColumns(programId);

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "name", desc: false }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Program Materials</FrameTitle>
				<FrameDescription>
					Materials students in {program?.name ?? "this program"} can be
					assigned
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button variant="outline" asChild>
							<Link href={`/programs/${programId}` as "/"}>
								<ArrowLeftIcon />
								Program
							</Link>
						</Button>
						<AddProgramMaterialDialog
							programId={programId}
							lessonIds={program?.lessons ?? []}
						>
							<Button>
								<PlusIcon />
								Add Material
							</Button>
						</AddProgramMaterialDialog>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<DataTable table={table}>
					<DataTableToolbar table={table} />
				</DataTable>
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const programId = params?.id;

	if (!programId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Program</AlertTitle>
				<AlertDescription>
					No valid program identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <ProgramMaterials programId={programId} />;
}
