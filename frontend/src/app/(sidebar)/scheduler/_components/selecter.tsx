"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field } from "@/components/ui/field";
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

export function UserSelector<
	TData = { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>({
	name = "user",
	label = "User",
	defaultUser,
	onSelect,
	api,
}: {
	name?: string;
	label?: string;
	defaultUser?: string;
	onSelect?: (data: TData) => void;
	api: UseQueryOptions<TData, TError, TData, TQueryKey>;
}) {
	const [user, setUser] = useQueryState(name);
	const { data: list } = useQuery(api);

	return (
		<Field className="w-auto">
			<Select
				defaultValue={defaultUser}
				value={user}
				onValueChange={(c) => {
					setUser(c);
					// if (onSelect) onSelect(c);
				}}
			>
				<SelectTrigger title="Hi">
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
						{list?.map((l) => (
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
