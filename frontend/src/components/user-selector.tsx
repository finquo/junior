"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FetchUser } from "@/hooks/user";
import { getInitials } from "@/lib/utils";

export function UserFormSelector<
	TData extends { id: string }[] = { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>({
	id,
	label = "User",
	value,
	onValueChange,
	disabled,
	api: queryApi,
}: {
	id?: string;
	label?: string;
	value?: string | null;
	onValueChange: (value: string | null) => void;
	disabled?: boolean;
	api: UseQueryOptions<TData, TError, TData, TQueryKey>;
}) {
	const { data: list } = useQuery(queryApi);

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Select
				value={value ?? ""}
				onValueChange={(selectedId) => {
					onValueChange(selectedId || null);
				}}
				disabled={disabled}
			>
				<SelectTrigger id={id}>
					<SelectValue
						placeholder={`Select a ${label}`}
						children={(item: string) => (
							<FetchUser
								id={item}
								children={(user) => (
									<span className="flex items-center gap-2">
										<Avatar className="size-5">
											<AvatarImage src={user.image} alt={user.name} />
											<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
										</Avatar>
										<span>{user.name}</span>
									</span>
								)}
							/>
						)}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a {label}</SelectLabel>
						{(list as { id: string }[] | undefined)?.map((l) => (
							<SelectItem key={l.id} value={l.id}>
								<FetchUser
									id={l.id}
									children={(user) => (
										<span className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage src={user.image} alt={user.name} />
												<AvatarFallback>
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
											<span>{user.name}</span>
										</span>
									)}
								/>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
