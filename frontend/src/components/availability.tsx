"use client";

import { Check, Copy, Plus, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type TimeRange = { id: string; start: string; end: string };
type DayAvailability = { enabled: boolean; ranges: TimeRange[] };
export type WeekAvailability = Record<DayKey, DayAvailability>;

type TimeOption = { value: string; label: string };

const WEEKDAYS: { key: DayKey; label: string }[] = [
	{ key: "mon", label: "Monday" },
	{ key: "tue", label: "Tuesday" },
	{ key: "wed", label: "Wednesday" },
	{ key: "thu", label: "Thursday" },
	{ key: "fri", label: "Friday" },
	{ key: "sat", label: "Saturday" },
	{ key: "sun", label: "Sunday" },
];

const toMinutes = (v: string) => {
	const [h, m] = v.split(":").map(Number) as [number, number];
	return h * 60 + m;
};

const toValue = (mins?: number) => {
	const clamped = Math.max(0, Math.min(24 * 60 - 1, mins as number));
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const label12 = (v: string) => {
	const [h, m] = v.split(":").map(Number) as [number, number];
	const ap = h < 12 ? "AM" : "PM";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
};

function buildOptions(step: number): TimeOption[] {
	const out: TimeOption[] = [];
	for (let m = 0; m < 24 * 60; m += step) {
		const value = toValue(m);
		out.push({ value, label: label12(value) });
	}
	return out;
}

function snapToOption(mins: number, slots: number[]) {
	let best = slots[0] as number;

	for (const slot of slots) {
		if (Math.abs(slot - mins) < Math.abs(best - mins)) best = slot;
	}
	return best;
}

function withCurrentOption(
	filtered: TimeOption[],
	all: TimeOption[],
	current?: string,
) {
	if (!current || filtered.some((o) => o.value === current)) return filtered;
	const extra =
		all.find((o) => o.value === current) ??
		({ value: current, label: label12(current) } satisfies TimeOption);
	return [...filtered, extra].sort(
		(a, b) => toMinutes(a.value) - toMinutes(b.value),
	);
}

function clampRange(
	start: string,
	end: string,
	options: TimeOption[],
	changed: "start" | "end" = "start",
): { start: string; end: string } {
	const slots = options.map((o) => toMinutes(o.value));
	if (slots.length === 0) return { start, end };

	const startM = toMinutes(start);
	const endM = toMinutes(end);
	if (endM > startM) return { start, end };

	const keepOrSnap = (value: string) => {
		const mins = toMinutes(value);
		return slots.includes(mins) ? mins : snapToOption(mins, slots);
	};

	if (changed === "end") {
		const e = keepOrSnap(end);
		const earlier = [...slots].reverse().find((slot) => slot < e);
		if (earlier === undefined && slots.length > 1) {
			return { start: toValue(slots[0]), end: toValue(slots[1]) };
		}
		return {
			start: toValue(earlier ?? keepOrSnap(start)),
			end: toValue(e),
		};
	}

	const s = keepOrSnap(start);
	const later = slots.find((slot) => slot > s);
	if (later === undefined && slots.length > 1) {
		return {
			start: toValue(slots[slots.length - 2]),
			end: toValue(slots[slots.length - 1]),
		};
	}
	return {
		start: toValue(s),
		end: toValue(later ?? keepOrSnap(end)),
	};
}

function startOptions(options: TimeOption[], end: string, current?: string) {
	const filtered = options.filter((o) => toMinutes(o.value) < toMinutes(end));
	const recovery = filtered.length === 0 ? options.slice(0, 1) : filtered;
	return withCurrentOption(recovery, options, current);
}

function endOptions(options: TimeOption[], start: string, current?: string) {
	const filtered = options.filter((o) => toMinutes(o.value) > toMinutes(start));
	const recovery = filtered.length === 0 ? options.slice(-1) : filtered;
	return withCurrentOption(recovery, options, current);
}

export function defaultWeek(): WeekAvailability {
	const workday = (day: DayKey): DayAvailability => ({
		enabled: true,
		ranges: [{ id: `${day}-0`, start: "09:00", end: "17:00" }],
	});
	const off = (day: DayKey): DayAvailability => ({
		enabled: false,
		ranges: [{ id: `${day}-0`, start: "09:00", end: "17:00" }],
	});
	return {
		mon: workday("mon"),
		tue: workday("tue"),
		wed: workday("wed"),
		thu: workday("thu"),
		fri: workday("fri"),
		sat: off("sat"),
		sun: off("sun"),
	};
}

interface CopyMenuProps {
	fromDay: DayKey;
	fromLabel: string;
	onApply: (targets: DayKey[]) => void;
}

function CopyMenu({ fromDay, fromLabel, onApply }: CopyMenuProps) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [picked, setPicked] = useState<DayKey[]>([]);

	const others = WEEKDAYS.filter((d) => d.key !== fromDay);

	const toggle = (k: DayKey) => {
		setPicked((prev) =>
			prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
		);
	};

	const apply = (targets: DayKey[]) => {
		if (targets.length === 0) return;
		onApply(targets);
		setOpen(false);
		setPicked([]);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Copy ${fromLabel} hours to other days`}
									className="text-muted-foreground hover:text-foreground"
								>
									{copied ? (
										<Check className="size-4 text-primary" />
									) : (
										<Copy className="size-4" />
									)}
								</Button>
							}
						/>
					}
				/>
				<TooltipContent>Copy times</TooltipContent>
			</Tooltip>

			<DropdownMenuContent align="end" className="w-56 p-2">
				<DropdownMenuLabel className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
					Copy {fromLabel} times to
				</DropdownMenuLabel>
				<div className="flex flex-col gap-1 py-1">
					{others.map((d) => (
						<label
							htmlFor={d.key}
							key={d.key}
							className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
						>
							<span>{d.label}</span>
							<Checkbox
								id={d.key}
								checked={picked.includes(d.key)}
								onCheckedChange={() => toggle(d.key)}
							/>
						</label>
					))}
				</div>
				<DropdownMenuSeparator />
				<div className="flex items-center gap-2 pt-2">
					<Button
						type="button"
						size="xs"
						variant="ghost"
						className="flex-1"
						onClick={() => apply(others.map((d) => d.key))}
					>
						Every day
					</Button>
					<Button
						type="button"
						size="xs"
						variant="default"
						className="flex-1"
						disabled={picked.length === 0}
						onClick={() => apply(picked)}
					>
						Apply
					</Button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface DayRowProps {
	day: DayKey;
	label: string;
	state: DayAvailability;
	options: TimeOption[];
	onChange: (next: DayAvailability) => void;
	onCopy: (targets: DayKey[]) => void;
}

function DayRow({ day, label, state, options, onChange, onCopy }: DayRowProps) {
	const idRef = useRef(0);
	const nextId = () => `${day}-n${idRef.current++}`;

	const setEnabled = (enabled: boolean) => {
		if (enabled && state.ranges.length === 0) {
			onChange({
				enabled,
				ranges: [{ id: nextId(), start: "09:00", end: "17:00" }],
			});
		} else {
			onChange({ ...state, enabled });
		}
	};

	const updateRange = (id: string, patch: Partial<TimeRange>) => {
		const changed: "start" | "end" =
			patch.start !== undefined ? "start" : "end";
		onChange({
			...state,
			ranges: state.ranges.map((r) => {
				if (r.id !== id) return r;
				const next = { ...r, ...patch };
				return {
					...next,
					...clampRange(next.start, next.end, options, changed),
				};
			}),
		});
	};

	const addRange = () => {
		const last = state.ranges[state.ranges.length - 1];
		const start = last ? Math.min(toMinutes(last.end) + 60, 24 * 60 - 60) : 540;
		onChange({
			enabled: true,
			ranges: [
				...state.ranges,
				{ id: nextId(), start: toValue(start), end: toValue(start + 60) },
			],
		});
	};

	const removeRange = (id: string) => {
		const ranges = state.ranges.filter((r) => r.id !== id);
		onChange({ enabled: ranges.length > 0, ranges });
	};

	const actions = (
		<>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Add time range to ${label}`}
							onClick={addRange}
							className="text-muted-foreground hover:text-foreground"
						>
							<Plus className="size-4" />
						</Button>
					}
				/>
				<TooltipContent>Add time</TooltipContent>
			</Tooltip>
			<CopyMenu fromDay={day} fromLabel={label} onApply={onCopy} />
		</>
	);

	return (
		<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
			{/* Toggle + Label (mobile actions placed alongside) */}
			<div className="flex items-center justify-between sm:w-36 sm:shrink-0 sm:justify-start sm:pt-1">
				<div className="flex items-center gap-2.5">
					<Switch
						checked={state.enabled}
						onCheckedChange={setEnabled}
						aria-label={`Toggle ${label} availability`}
					/>
					<span className="font-medium text-foreground text-sm">{label}</span>
				</div>
				<div className="flex items-center gap-1 sm:hidden">{actions}</div>
			</div>

			{/* Time ranges or unavailable status */}
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				{state.enabled ? (
					state.ranges.map((r) => (
						<div key={r.id} className="flex items-center gap-2">
							<div className="min-w-0 flex-1 sm:max-w-[130px]">
								<Select
									value={r.start}
									onValueChange={(val) => {
										if (typeof val === "string") {
											updateRange(r.id, { start: val });
										}
									}}
								>
									<SelectTrigger size="sm" className="w-full tabular-nums">
										<SelectValue placeholder="Start time">
											{options.find((o) => o.value === r.start)?.label ??
												label12(r.start)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="max-h-56">
										{startOptions(options, r.end, r.start).map((o) => (
											<SelectItem
												key={o.value}
												value={o.value}
												className="tabular-nums"
											>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<span className="text-muted-foreground">–</span>

							<div className="min-w-0 flex-1 sm:max-w-[130px]">
								<Select
									value={r.end}
									onValueChange={(val) => {
										if (typeof val === "string") {
											updateRange(r.id, { end: val });
										}
									}}
								>
									<SelectTrigger size="sm" className="w-full tabular-nums">
										<SelectValue placeholder="End time">
											{options.find((o) => o.value === r.end)?.label ??
												label12(r.end)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="max-h-56">
										{endOptions(options, r.start, r.end).map((o) => (
											<SelectItem
												key={o.value}
												value={o.value}
												className="tabular-nums"
											>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Remove time range"
											onClick={() => removeRange(r.id)}
											className="text-muted-foreground hover:text-foreground"
										>
											<X className="size-4" />
										</Button>
									}
								/>
								<TooltipContent>Remove</TooltipContent>
							</Tooltip>
						</div>
					))
				) : (
					<span className="py-1 text-muted-foreground text-sm">
						Unavailable
					</span>
				)}
			</div>

			{/* Actions (desktop) */}
			<div className="hidden shrink-0 items-center gap-1 sm:flex">
				{actions}
			</div>
		</div>
	);
}

interface AvailabilitySchedulerProps {
	value?: WeekAvailability;
	defaultValue?: WeekAvailability;
	onChange?: (value: WeekAvailability) => void;
	/** Minutes between selectable times. Default 30. */
	step?: number;
	className?: string;
}

export function AvailabilityScheduler({
	value,
	defaultValue,
	onChange,
	step = 30,
	className,
}: AvailabilitySchedulerProps) {
	const options = useMemo(() => buildOptions(step), [step]);
	const idRef = useRef(0);

	const [internal, setInternal] = useState<WeekAvailability>(
		() => defaultValue ?? defaultWeek(),
	);
	const controlled = value !== undefined;
	const week = controlled ? value : internal;

	const commit = useCallback(
		(next: WeekAvailability) => {
			if (!controlled) setInternal(next);
			onChange?.(next);
		},
		[controlled, onChange],
	);

	const setDay = useCallback(
		(day: DayKey, next: DayAvailability) => {
			commit({ ...week, [day]: next });
		},
		[commit, week],
	);

	const copyDay = useCallback(
		(from: DayKey, targets: DayKey[]) => {
			const source = week[from];
			const next = { ...week };
			for (const t of targets) {
				next[t] = {
					enabled: source.enabled,
					ranges: source.ranges.map((r) => ({
						...r,
						id: `${t}-c${idRef.current++}`,
					})),
				};
			}
			commit(next);
		},
		[commit, week],
	);

	return (
		<TooltipProvider>
			<div className={cn("divide-y divide-border", className)}>
				{WEEKDAYS.map(({ key, label }) => (
					<DayRow
						key={key}
						day={key}
						label={label}
						state={week[key]}
						options={options}
						onChange={(next) => setDay(key, next)}
						onCopy={(targets) => copyDay(key, targets)}
					/>
				))}
			</div>
		</TooltipProvider>
	);
}
