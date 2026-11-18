"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
	Autocomplete,
	AutocompleteContent,
	AutocompleteInput,
	AutocompleteItem,
	AutocompleteList,
	AutocompleteStatus,
} from "@/components/reui/autocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FetchUser } from "@/hooks/user";
import { getInitials } from "@/lib/utils";

function UserOption({ id }: { id: string }) {
	return (
		<FetchUser
			id={id}
			isPending={
				<span className="flex items-center gap-2">
					<Skeleton className="size-5 rounded-full" />
					<Skeleton className="h-4 w-24" />
				</span>
			}
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
	);
}

type SelectorFieldProps = {
	name: string;
	label: string;
	value?: string;
	defaultUser?: string;
	onValueChange: (id: string) => void;
	list: { id: string }[] | undefined;
};

function SelectorField({
	name,
	label,
	value,
	defaultUser,
	onValueChange,
	list,
}: SelectorFieldProps) {
	return (
		<Select
			defaultValue={defaultUser}
			value={value}
			onValueChange={(selectedId) => {
				if (!selectedId) return;
				onValueChange(selectedId);
			}}
		>
			<SelectTrigger id={name} className="w-full min-w-[200px]">
				<SelectValue
					placeholder={`Select a ${label}`}
					children={(item: string) => <UserOption id={item} />}
				/>
			</SelectTrigger>
			<SelectContent alignItemWithTrigger={false}>
				<SelectGroup>
					<SelectLabel>Select a {label}</SelectLabel>
					{list?.map((l) => (
						<SelectItem key={l.id} value={l.id}>
							<UserOption id={l.id} />
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

type BaseProps<TData extends { id: string }[]> = {
	name?: string;
	label?: string;
	defaultUser?: string;
	value?: string;
	onChange?: (id: string | undefined) => void;
	onSelect?: (item: TData[number]) => void;
};

type ListProps<
	TData extends { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
> = BaseProps<TData> & {
	api: UseQueryOptions<TData, TError, TData, TQueryKey>;
	search?: never;
};

type SearchProps<
	TData extends { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
> = BaseProps<TData> & {
	api?: never;
	search: (query: string) => UseQueryOptions<TData, TError, TData, TQueryKey>;
};

function UserListSelector<
	TData extends { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>({
	name = "user",
	label = "User",
	defaultUser,
	value,
	onChange,
	onSelect,
	api,
}: ListProps<TData, TError, TQueryKey>) {
	const [urlUser, setUrlUser] = useQueryState(name);
	const user = value ?? urlUser;

	const setUser = (id: string) => {
		if (onChange) return onChange(id);
		setUrlUser(id);
	};

	const { data: list, isPending } = useQuery(api);

	useEffect(() => {
		if (onSelect) {
			if (!list) return;

			const selectedItem = list.find((item) => item.id === user);
			if (selectedItem) {
				onSelect(selectedItem);
			}
		}
	}, [user, list, onSelect]);

	if (isPending) {
		return (
			<Field className="w-full min-w-[200px] sm:w-auto">
				<FieldLabel htmlFor={name}>{label}</FieldLabel>
				<div className="flex h-9 w-full min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
					<Skeleton className="size-5 rounded-full" />
					<Skeleton className="h-4 w-28" />
				</div>
			</Field>
		);
	}

	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<SelectorField
				name={name}
				label={label}
				value={user ?? undefined}
				defaultUser={defaultUser}
				onValueChange={setUser}
				list={list as { id: string }[] | undefined}
			/>
		</Field>
	);
}

function UserSearchSelector<
	TData extends { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>({
	name = "user",
	label = "User",
	value,
	onChange,
	onSelect,
	search,
}: SearchProps<TData, TError, TQueryKey>) {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300);

	const { data: list, isPending } = useQuery({
		...search(debouncedQuery),
		enabled: debouncedQuery.length >= 3,
	});

	const results = (list ?? []) as unknown as {
		id: string;
		name?: string;
	}[];

	useEffect(() => {
		if (onSelect) {
			if (!list) return;

			const selectedItem = list.find((item) => item.id === value);
			if (selectedItem) {
				onSelect(selectedItem);
			}
		}
	}, [value, list, onSelect]);

	let status: React.ReactNode = `Type at least 3 letters to search ${label.toLowerCase()}s...`;

	if (isPending) {
		status = "Searching...";
	} else if (results.length === 0 && debouncedQuery.length >= 3) {
		status = `No ${label.toLowerCase()}s found for "${debouncedQuery}"`;
	} else if (results.length > 0) {
		status = `${results.length} found`;
	}

	const pick = (item: { id: string; name?: string }) => {
		onChange?.(item.id);
		setQuery(item.name ?? "");
	};

	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Autocomplete
				items={results}
				value={query}
				onValueChange={(next) => {
					setQuery(next);
					// The autocomplete's own clear button empties the text: drop the selection.
					if (next === "") onChange?.(undefined);
				}}
				itemToStringValue={(item: unknown) =>
					(item as { name?: string }).name ?? ""
				}
				filter={null}
			>
				<AutocompleteInput
					id={name}
					placeholder={`Select a ${label}`}
					showTrigger
					showClear
				/>
				{query !== "" && (
					<AutocompleteContent>
						<AutocompleteStatus>{status}</AutocompleteStatus>
						<AutocompleteList>
							{(item: { id: string; name?: string }) => (
								<AutocompleteItem
									key={item.id}
									value={item}
									className="rounded-lg"
									onClick={() => pick(item)}
								>
									<UserOption id={item.id} />
								</AutocompleteItem>
							)}
						</AutocompleteList>
					</AutocompleteContent>
				)}
			</Autocomplete>
			{value && (
				<FetchUser
					id={value}
					isPending={
						<Item variant="outline">
							<ItemMedia>
								<Skeleton className="size-9 rounded-full" />
							</ItemMedia>
							<ItemContent>
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-48" />
							</ItemContent>
						</Item>
					}
				>
					{(user) => (
						<Item variant="outline">
							<ItemMedia>
								<Avatar>
									<AvatarImage src={user.image ?? undefined} alt={user.name} />
									<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
								</Avatar>
							</ItemMedia>
							<ItemContent>
								<ItemTitle>{user.name}</ItemTitle>
								<ItemDescription>{user.email}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Badge variant="outline" className="capitalize">
									{user.role}
								</Badge>
							</ItemActions>
						</Item>
					)}
				</FetchUser>
			)}
		</Field>
	);
}

export function UserSelector<
	TData extends { id: string }[] = { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>(
	props:
		| ListProps<TData, TError, TQueryKey>
		| SearchProps<TData, TError, TQueryKey>,
) {
	if (props.search) {
		return <UserSearchSelector {...props} />;
	}

	return <UserListSelector {...props} />;
}
