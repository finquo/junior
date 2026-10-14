"use client";

import {
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	GripVertical,
	Lock,
} from "lucide-react";
import {
	type KeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Strict Types & Interfaces
// ---------------------------------------------------------------------------

/** Strict "HH:mm" 24-hour time string, e.g. "09:00", "13:30", "17:00", "24:00" */
export type TimeString = string;

export interface BlockedTime {
	/** Start time in "HH:mm" format (e.g. "12:00") */
	start: TimeString;
	/** End time in "HH:mm" format (e.g. "13:00") */
	end: TimeString;
	/** Optional human-readable description for the blocked interval */
	label?: string;
	/** Optional unique identifier */
	id?: string;
}

export interface DaySliderChangeDetails {
	/** Start time in minutes from midnight (0 - 1440) */
	startMinutes: number;
	/** End time in minutes from midnight (0 - 1440) */
	endMinutes: number;
	/** End time formatted as "HH:mm" */
	endTime: TimeString;
	/** Duration of the slider in minutes */
	durationMinutes: number;
	/** Formatted 12-hour display string (e.g. "9:00 AM – 10:00 AM") */
	formatted12: string;
}

export interface DaySliderProps {
	/**
	 * Lower limit of the allowed scheduling window in "HH:mm" format.
	 * When provided, also rendered prominently on the scale below the slider.
	 * Must be between "00:00" and "24:00".
	 * Default: "00:00"
	 * Example: "09:00"
	 */
	lowerLimit?: TimeString;

	/**
	 * Upper limit of the allowed scheduling window in "HH:mm" format.
	 * When provided, also rendered prominently on the scale below the slider.
	 * Must be greater than lowerLimit.
	 * Default: "24:00"
	 * Example: "17:00"
	 */
	upperLimit?: TimeString;

	/**
	 * Buffer in hours rendered on either side of lowerLimit and upperLimit.
	 * When limits are set, slider renders [lower - buffer, upper + buffer]
	 * instead of the entire 24h day.
	 * Default: 2 (hours).
	 * Example: 9:00 to 17:00 with 2h buffer renders 7:00 to 19:00 (7 AM – 7 PM).
	 */
	bufferHours?: number;

	/**
	 * Fixed duration of the slider block strictly in minutes (e.g. 30, 45, 60, 90).
	 * Must be a positive integer > 0.
	 */
	fixedLength: number;

	/**
	 * Controlled start time in "HH:mm" format (e.g. "09:00").
	 */
	value?: TimeString;

	/**
	 * Initial start time for uncontrolled usage in "HH:mm" format (e.g. "09:00").
	 * Defaults to lowerLimit (or first valid empty space).
	 */
	defaultValue?: TimeString;

	/**
	 * Callback triggered whenever the slider position changes.
	 * Output: startTime string in strict "HH:mm" format.
	 * Also receives details metadata as second argument.
	 */
	onChange?: (startTime: TimeString, details: DaySliderChangeDetails) => void;

	/**
	 * Array of blocked time intervals (e.g. lunch break, snack break).
	 */
	blockedTimes?: BlockedTime[];

	/**
	 * Snapping step interval in minutes.
	 * Must be a positive integer.
	 * Default: 15
	 */
	step?: number;

	/** Accessible label / heading for the slider */
	label?: string;

	/** Optional container className */
	className?: string;

	/** Disabled state */
	disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Strict Parsing & Formatting Functions
// ---------------------------------------------------------------------------

const TOTAL_DAY_MINUTES = 24 * 60; // 1440 minutes

/**
 * Strictly parses a "HH:mm" 24-hour time string into minutes from midnight (0 - 1440).
 * Validates format and range strictly without guesswork.
 */
export function timeStringToMinutes(
	time: string | undefined,
	fallback = 0,
): number {
	if (!time || typeof time !== "string") {
		return fallback;
	}

	const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!match) {
		console.warn(
			`[DaySlider] Invalid time format "${time}". Expected strict "HH:mm" format (e.g. "09:00").`,
		);
		return fallback;
	}

	const rawHours = match[1];
	const rawMinutes = match[2];
	if (rawHours === undefined || rawMinutes === undefined) {
		return fallback;
	}

	const hours = Number.parseInt(rawHours, 10);
	const minutes = Number.parseInt(rawMinutes, 10);

	if (hours < 0 || hours > 24 || minutes < 0 || minutes >= 60) {
		console.warn(
			`[DaySlider] Out-of-bounds time "${time}". Hours must be 0-24 and minutes 0-59.`,
		);
		return fallback;
	}

	if (hours === 24 && minutes > 0) {
		console.warn(
			`[DaySlider] Time cannot exceed 24:00. Received "${time}". Clamping to 24:00.`,
		);
		return TOTAL_DAY_MINUTES;
	}

	return Math.min(TOTAL_DAY_MINUTES, Math.max(0, hours * 60 + minutes));
}

/**
 * Formats minutes from midnight into strict 24-hour "HH:mm" string.
 */
export function minutesToTimeString(minutes: number): TimeString {
	const clamped = Math.max(0, Math.min(TOTAL_DAY_MINUTES, Math.round(minutes)));
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Formats minutes to 12-hour display string for UI readability (e.g. "9:00 AM", "5:00 PM").
 */
export function formatTime12(minutes: number): string {
	const clamped = Math.max(0, Math.min(TOTAL_DAY_MINUTES, Math.round(minutes)));
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	const period = h < 12 || h === 24 ? "AM" : "PM";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Formats duration in minutes for human display (e.g. "1h", "45m", "1h 30m").
 */
export function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
}

// ---------------------------------------------------------------------------
// Main DaySlider Component
// ---------------------------------------------------------------------------

export function DaySlider({
	lowerLimit,
	upperLimit,
	bufferHours = 2,
	fixedLength,
	value: controlledValue,
	defaultValue,
	onChange,
	blockedTimes = [],
	step = 15,
	label = "Daily Schedule",
	className,
	disabled = false,
}: DaySliderProps) {
	// Strict validation of fixedLength
	const durationMin = useMemo(() => {
		const sanitized = Math.round(Number(fixedLength));
		if (!Number.isFinite(sanitized) || sanitized <= 0) {
			console.warn(
				`[DaySlider] Invalid fixedLength "${fixedLength}". Expected positive number in minutes. Defaulting to 60.`,
			);
			return 60;
		}
		return Math.min(TOTAL_DAY_MINUTES, sanitized);
	}, [fixedLength]);

	// Strict parsing of lower and upper limits
	const lowerMin = useMemo(
		() => (lowerLimit !== undefined ? timeStringToMinutes(lowerLimit, 0) : 0),
		[lowerLimit],
	);

	const upperMin = useMemo(() => {
		const parsed =
			upperLimit !== undefined
				? timeStringToMinutes(upperLimit, TOTAL_DAY_MINUTES)
				: TOTAL_DAY_MINUTES;

		if (parsed <= lowerMin) {
			console.warn(
				`[DaySlider] upperLimit ("${upperLimit}") must be greater than lowerLimit ("${lowerLimit}").`,
			);
			return Math.min(TOTAL_DAY_MINUTES, lowerMin + durationMin);
		}
		return parsed;
	}, [upperLimit, lowerMin, durationMin]);

	// Check if boundary limits are applied to determine visible track range
	const isBounded = lowerLimit !== undefined || upperLimit !== undefined;
	const bufferMin = Math.max(0, Math.round(bufferHours * 60));

	// Visible track range: if bounded, render [lower - buffer, upper + buffer], else 24h
	const trackStartMin = useMemo(() => {
		if (!isBounded) return 0;
		return Math.max(0, lowerMin - bufferMin);
	}, [isBounded, lowerMin, bufferMin]);

	const trackEndMin = useMemo(() => {
		if (!isBounded) return TOTAL_DAY_MINUTES;
		return Math.min(TOTAL_DAY_MINUTES, upperMin + bufferMin);
	}, [isBounded, upperMin, bufferMin]);

	const trackDurationMin = Math.max(1, trackEndMin - trackStartMin);

	// Strict step validation
	const sanitizedStep = useMemo(() => {
		const s = Math.round(Number(step));
		return Number.isFinite(s) && s > 0 ? s : 15;
	}, [step]);

	// Normalize and strictly validate blocked intervals within allowed window
	const normalizedBlocked = useMemo(() => {
		const items: Array<{
			start: number;
			end: number;
			label: string;
			id: string;
		}> = [];

		blockedTimes.forEach((b, idx) => {
			const rawStart = timeStringToMinutes(b.start, -1);
			const rawEnd = timeStringToMinutes(b.end, -1);

			if (rawStart === -1 || rawEnd === -1) {
				console.warn(
					`[DaySlider] Skipping invalid blocked time at index ${idx}: start="${b.start}", end="${b.end}".`,
				);
				return;
			}

			if (rawEnd <= rawStart) {
				console.warn(
					`[DaySlider] Blocked end time ("${b.end}") must be after start time ("${b.start}"). Skipping.`,
				);
				return;
			}

			// Clamp block to schedulable bounds [lowerMin, upperMin]
			const start = Math.max(lowerMin, Math.min(upperMin, rawStart));
			const end = Math.max(lowerMin, Math.min(upperMin, rawEnd));

			if (end > start) {
				items.push({
					start,
					end,
					label:
						b.label ||
						`Blocked (${formatTime12(start)} – ${formatTime12(end)})`,
					id: b.id || `blocked-${idx}`,
				});
			}
		});

		// Sort chronologically by start
		items.sort((a, b) => a.start - b.start);
		return items;
	}, [blockedTimes, lowerMin, upperMin]);

	// Calculate disjoint available empty segments where length >= durationMin
	const validStartRanges = useMemo(() => {
		if (upperMin - lowerMin < durationMin) return [];

		// Merge overlapping/contiguous blocked intervals
		const mergedBlocked: Array<{ start: number; end: number }> = [];
		for (const b of normalizedBlocked) {
			const prev = mergedBlocked[mergedBlocked.length - 1];
			if (!prev) {
				mergedBlocked.push({ start: b.start, end: b.end });
			} else if (b.start <= prev.end) {
				prev.end = Math.max(prev.end, b.end);
			} else {
				mergedBlocked.push({ start: b.start, end: b.end });
			}
		}

		// Find free spaces between merged blocked zones
		const freeSpaces: Array<{ start: number; end: number }> = [];
		let cursor = lowerMin;

		for (const block of mergedBlocked) {
			if (block.start > cursor) {
				freeSpaces.push({ start: cursor, end: block.start });
			}
			cursor = Math.max(cursor, block.end);
		}
		if (cursor < upperMin) {
			freeSpaces.push({ start: cursor, end: upperMin });
		}

		// Filter free spaces that can fit fixedLength
		const validRanges: Array<{
			min: number;
			max: number;
			spaceStart: number;
			spaceEnd: number;
		}> = [];

		for (const space of freeSpaces) {
			const spaceDuration = space.end - space.start;
			if (spaceDuration >= durationMin) {
				validRanges.push({
					min: space.start,
					max: space.end - durationMin,
					spaceStart: space.start,
					spaceEnd: space.end,
				});
			}
		}

		return validRanges;
	}, [lowerMin, upperMin, durationMin, normalizedBlocked]);

	// Snapping helper: snaps candidate position to nearest valid empty space
	const snapToEmptySpace = useCallback(
		(targetStart: number): number => {
			if (validStartRanges.length === 0) {
				return lowerMin;
			}

			// Step-round candidate
			const stepped = Math.round(targetStart / sanitizedStep) * sanitizedStep;

			// If stepped target lands inside a valid range, return it
			for (const range of validStartRanges) {
				if (stepped >= range.min && stepped <= range.max) {
					return stepped;
				}
			}

			// Otherwise, find the closest valid start bound in empty spaces
			const firstRange = validStartRanges[0];
			if (!firstRange) {
				return lowerMin;
			}

			let closest = firstRange.min;
			let minDiff = Number.POSITIVE_INFINITY;

			for (const range of validStartRanges) {
				const candidate =
					stepped < range.min
						? range.min
						: stepped > range.max
							? range.max
							: Math.round(stepped / sanitizedStep) * sanitizedStep;

				const clampedCandidate = Math.max(
					range.min,
					Math.min(range.max, candidate),
				);
				const diff = Math.abs(stepped - clampedCandidate);

				if (diff < minDiff) {
					minDiff = diff;
					closest = clampedCandidate;
				}
			}

			return closest;
		},
		[validStartRanges, sanitizedStep, lowerMin],
	);

	// Initial value resolution
	const [internalStart, setInternalStart] = useState<number>(() => {
		const initialStr = defaultValue ?? controlledValue ?? lowerLimit;
		const initialMin = timeStringToMinutes(initialStr, lowerMin);
		return snapToEmptySpace(initialMin);
	});

	const isControlled = controlledValue !== undefined;
	const currentStart = isControlled
		? snapToEmptySpace(timeStringToMinutes(controlledValue, lowerMin))
		: internalStart;

	const currentEnd = currentStart + durationMin;

	// Emit change helper
	const emitChange = useCallback(
		(newStart: number) => {
			const end = newStart + durationMin;
			const startTimeStr = minutesToTimeString(newStart);
			const endTimeStr = minutesToTimeString(end);
			const s12 = formatTime12(newStart);
			const e12 = formatTime12(end);

			const details: DaySliderChangeDetails = {
				startMinutes: newStart,
				endMinutes: end,
				endTime: endTimeStr,
				durationMinutes: durationMin,
				formatted12: `${s12} – ${e12}`,
			};

			if (!isControlled) {
				setInternalStart(newStart);
			}

			onChange?.(startTimeStr, details);
		},
		[durationMin, isControlled, onChange],
	);

	// Dragging state & refs
	const trackRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffsetMinutes, setDragOffsetMinutes] = useState(0);

	// Convert pointer clientX to minutes along the visible track [trackStartMin, trackEndMin]
	const clientXToMinutes = useCallback(
		(clientX: number): number => {
			if (!trackRef.current) return 0;
			const rect = trackRef.current.getBoundingClientRect();
			if (rect.width <= 0) return 0;
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width),
			);
			return trackStartMin + ratio * trackDurationMin;
		},
		[trackStartMin, trackDurationMin],
	);

	// Handle pointer down on the slider thumb / block
	const handleThumbPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		setIsDragging(true);

		const clickMinute = clientXToMinutes(e.clientX);
		setDragOffsetMinutes(clickMinute - currentStart);
	};

	// Handle pointer move while dragging
	const handleThumbPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!isDragging || disabled) return;
		const clickMinute = clientXToMinutes(e.clientX);
		const rawTarget = clickMinute - dragOffsetMinutes;
		const snapped = snapToEmptySpace(rawTarget);

		if (snapped !== currentStart) {
			emitChange(snapped);
		}
	};

	// Handle pointer up
	const handleThumbPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {
			// Pointer capture might have already been released
		}
		setIsDragging(false);
	};

	// Handle direct click on the track
	const handleTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		const clickMinute = clientXToMinutes(e.clientX);
		// Center the fixed length around clicked point
		const targetStart = clickMinute - durationMin / 2;
		const snapped = snapToEmptySpace(targetStart);
		emitChange(snapped);
	};

	// Keyboard navigation
	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
			e.preventDefault();
			const target = currentStart - sanitizedStep;
			emitChange(snapToEmptySpace(target));
		} else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
			e.preventDefault();
			const target = currentStart + sanitizedStep;
			emitChange(snapToEmptySpace(target));
		} else if (e.key === "Home") {
			e.preventDefault();
			const firstRange = validStartRanges[0];
			if (firstRange) {
				emitChange(firstRange.min);
			}
		} else if (e.key === "End") {
			e.preventDefault();
			const lastRange = validStartRanges[validStartRanges.length - 1];
			if (lastRange) {
				emitChange(lastRange.max);
			}
		}
	};

	// Slot jump buttons
	const jumpToNextSlot = () => {
		const nextCandidate = currentStart + durationMin;
		const snapped = snapToEmptySpace(nextCandidate);
		if (snapped !== currentStart) emitChange(snapped);
	};

	const jumpToPrevSlot = () => {
		const prevCandidate = currentStart - durationMin;
		const snapped = snapToEmptySpace(prevCandidate);
		if (snapped !== currentStart) emitChange(snapped);
	};

	// Percent helpers for visible track
	const toPercent = useCallback(
		(mins: number) => {
			const clamped = Math.max(trackStartMin, Math.min(trackEndMin, mins));
			return `${((clamped - trackStartMin) / trackDurationMin) * 100}%`;
		},
		[trackStartMin, trackEndMin, trackDurationMin],
	);

	const toWidthPercent = useCallback(
		(mins: number) => {
			return `${(mins / trackDurationMin) * 100}%`;
		},
		[trackDurationMin],
	);

	// Generate dynamic base axis marks for the visible track span
	const axisMarks = useMemo(() => {
		const spanHours = (trackEndMin - trackStartMin) / 60;
		const hourStep = spanHours <= 6 ? 1 : spanHours <= 14 ? 2 : 3;
		const stepMins = hourStep * 60;

		const marks: Array<{
			minutes: number;
			label: string;
			isEdge: "start" | "end" | "middle";
		}> = [];

		for (let m = trackStartMin; m <= trackEndMin; m += stepMins) {
			const isFirst = m === trackStartMin;
			const isLast = m + stepMins > trackEndMin;

			marks.push({
				minutes: m,
				label: formatTime12(m).replace(":00", ""),
				isEdge: isFirst
					? "start"
					: isLast && m === trackEndMin
						? "end"
						: "middle",
			});
		}

		// Ensure trackEndMin is included if loop ended early
		const lastMark = marks[marks.length - 1];
		if (!lastMark || lastMark.minutes !== trackEndMin) {
			if (lastMark && trackEndMin - lastMark.minutes < stepMins / 2) {
				marks.pop(); // drop to avoid label collision
			}
			marks.push({
				minutes: trackEndMin,
				label: formatTime12(trackEndMin).replace(":00", ""),
				isEdge: "end",
			});
		}

		return marks;
	}, [trackStartMin, trackEndMin]);

	// Filter out regular marks that collide with explicitly provided limits
	const filteredAxisMarks = useMemo(() => {
		return axisMarks.filter((m) => {
			if (lowerLimit !== undefined && Math.abs(m.minutes - lowerMin) < 40) {
				return false;
			}
			if (upperLimit !== undefined && Math.abs(m.minutes - upperMin) < 40) {
				return false;
			}
			return true;
		});
	}, [axisMarks, lowerLimit, upperLimit, lowerMin, upperMin]);

	// Subtle hour tick lines within the visible track
	const hourTicks = useMemo(() => {
		const ticks: number[] = [];
		const firstHourMin = Math.ceil(trackStartMin / 60) * 60;
		for (let m = firstHourMin; m < trackEndMin; m += 60) {
			ticks.push(m);
		}
		return ticks;
	}, [trackStartMin, trackEndMin]);

	const hasAvailableSpace = validStartRanges.length > 0;

	return (
		<div
			className={cn(
				"w-full select-none rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
				disabled && "pointer-events-none opacity-60",
				className,
			)}
		>
			{/* Header & Status Information */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<div className="flex items-center gap-2">
						<Clock className="size-4 text-primary" />
						<h3 className="font-semibold text-foreground text-sm">{label}</h3>
					</div>
					<p className="text-muted-foreground text-xs">
						Window: {formatTime12(lowerMin)} – {formatTime12(upperMin)}
						{isBounded && (
							<>
								{" "}
								• Track: {formatTime12(trackStartMin)} –{" "}
								{formatTime12(trackEndMin)}
							</>
						)}{" "}
						• Duration: {formatDuration(durationMin)}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{hasAvailableSpace ? (
						<div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs">
							<span className="font-semibold text-foreground tabular-nums">
								{minutesToTimeString(currentStart)} –{" "}
								{minutesToTimeString(currentEnd)}
							</span>
							<span className="text-muted-foreground">
								({formatDuration(durationMin)})
							</span>
						</div>
					) : (
						<div className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-destructive text-xs">
							<AlertCircle className="size-3.5" />
							<span>No available space for this duration</span>
						</div>
					)}

					{/* Quick jump step buttons */}
					<div className="flex items-center gap-0.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon-xs"
									disabled={disabled || !hasAvailableSpace}
									onClick={jumpToPrevSlot}
									aria-label="Previous slot"
								>
									<ChevronLeft className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Previous slot</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon-xs"
									disabled={disabled || !hasAvailableSpace}
									onClick={jumpToNextSlot}
									aria-label="Next slot"
								>
									<ChevronRight className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Next slot</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>

			{/* Slider Track Area */}
			<div className="relative pt-6 pb-9">
				{/* Visible Track: renders [trackStartMin, trackEndMin] */}
				<div
					ref={trackRef}
					onPointerDown={handleTrackPointerDown}
					className="relative h-11 w-full cursor-pointer rounded-lg border border-border bg-muted/40 shadow-inner"
				>
					{/* Lower Bounded Buffer Area (before lowerLimit) */}
					{isBounded && lowerMin > trackStartMin && (
						<div
							style={{
								left: "0%",
								width: toPercent(lowerMin),
							}}
							className="absolute inset-y-0 border-primary/40 border-r-2 border-dashed bg-muted/80 backdrop-blur-[1px]"
							title={`Outside active window (before ${minutesToTimeString(lowerMin)})`}
						>
							<div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_12px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_12px)]" />
						</div>
					)}

					{/* Upper Bounded Buffer Area (after upperLimit) */}
					{isBounded && upperMin < trackEndMin && (
						<div
							style={{
								left: toPercent(upperMin),
								width: toWidthPercent(trackEndMin - upperMin),
							}}
							className="absolute inset-y-0 border-primary/40 border-l-2 border-dashed bg-muted/80 backdrop-blur-[1px]"
							title={`Outside active window (after ${minutesToTimeString(upperMin)})`}
						>
							<div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_12px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_12px)]" />
						</div>
					)}

					{/* Blocked Times intervals within visible track */}
					{normalizedBlocked.map((b) => {
						const visibleStart = Math.max(trackStartMin, b.start);
						const visibleEnd = Math.min(trackEndMin, b.end);
						if (visibleEnd <= visibleStart) return null;

						return (
							<Tooltip key={b.id}>
								<TooltipTrigger asChild>
									<div
										style={{
											left: toPercent(visibleStart),
											width: toWidthPercent(visibleEnd - visibleStart),
										}}
										className="absolute inset-y-0 z-10 flex cursor-not-allowed items-center justify-center border-border/80 border-r border-l bg-destructive/15 transition-colors hover:bg-destructive/25"
									>
										<div className="flex items-center gap-1 overflow-hidden px-1 text-destructive">
											<Lock className="size-3 shrink-0" />
											<span className="truncate font-medium text-[10px]">
												{b.label}
											</span>
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-semibold">{b.label}</p>
									<p className="text-[11px] opacity-80">
										{minutesToTimeString(b.start)} –{" "}
										{minutesToTimeString(b.end)} (Blocked)
									</p>
								</TooltipContent>
							</Tooltip>
						);
					})}

					{/* Hour subtle tick lines within track */}
					{hourTicks.map((mins) => (
						<div
							key={mins}
							style={{ left: toPercent(mins) }}
							className="pointer-events-none absolute inset-y-0 border-border/50 border-r"
						/>
					))}

					{/* Draggable Slider Block */}
					{hasAvailableSpace && (
						<div
							role="slider"
							tabIndex={disabled ? -1 : 0}
							aria-label={`${label} block, duration ${formatDuration(durationMin)}`}
							aria-valuemin={lowerMin}
							aria-valuemax={upperMin - durationMin}
							aria-valuenow={currentStart}
							aria-valuetext={`${minutesToTimeString(currentStart)} to ${minutesToTimeString(currentEnd)}`}
							onKeyDown={handleKeyDown}
							onPointerDown={handleThumbPointerDown}
							onPointerMove={handleThumbPointerMove}
							onPointerUp={handleThumbPointerUp}
							style={{
								left: toPercent(currentStart),
								width: toWidthPercent(durationMin),
							}}
							className={cn(
								"absolute inset-y-0 z-20 flex cursor-grab items-center justify-between rounded-lg border-2 border-primary bg-primary text-primary-foreground shadow-md transition-[box-shadow,border-color]",
								"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
								isDragging &&
									"cursor-grabbing shadow-lg ring-2 ring-primary/40",
							)}
						>
							{/* Left handle grip */}
							<div className="flex h-full items-center px-0.5 opacity-70">
								<GripVertical className="size-3.5" />
							</div>

							{/* Center Label (Start - End) */}
							<div className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 text-center">
								<span className="truncate font-semibold text-[11px] tabular-nums leading-tight sm:text-xs">
									{minutesToTimeString(currentStart)}
								</span>
								<span className="truncate text-[9px] opacity-80 sm:text-[10px]">
									to {minutesToTimeString(currentEnd)}
								</span>
							</div>

							{/* Right handle grip */}
							<div className="flex h-full items-center px-0.5 opacity-70">
								<GripVertical className="size-3.5" />
							</div>
						</div>
					)}
				</div>

				{/* Scale & Axis Marks below Track */}
				<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-7">
					{/* Regular Axis Marks */}
					{filteredAxisMarks.map((mark) => (
						<div
							key={mark.minutes}
							style={{
								position: "absolute",
								left:
									mark.isEdge === "start"
										? "0%"
										: mark.isEdge === "end"
											? "100%"
											: toPercent(mark.minutes),
								transform:
									mark.isEdge === "start"
										? "none"
										: mark.isEdge === "end"
											? "translateX(-100%)"
											: "translateX(-50%)",
							}}
							className="whitespace-nowrap pt-2 text-[10px] text-muted-foreground"
						>
							{mark.label}
						</div>
					))}

					{/* Explicit Lower Limit Marker on the Scale */}
					{lowerLimit !== undefined && (
						<div
							style={{
								position: "absolute",
								left: lowerMin === trackStartMin ? "0%" : toPercent(lowerMin),
								transform:
									lowerMin === trackStartMin ? "none" : "translateX(-50%)",
							}}
							className="flex flex-col items-center pt-0.5"
							title={`Lower limit: ${minutesToTimeString(lowerMin)}`}
						>
							<div className="h-1.5 w-1 rounded-full bg-primary" />
							<span className="whitespace-nowrap font-bold text-[10px] text-primary tabular-nums">
								{formatTime12(lowerMin)}
							</span>
						</div>
					)}

					{/* Explicit Upper Limit Marker on the Scale */}
					{upperLimit !== undefined && (
						<div
							style={{
								position: "absolute",
								left: upperMin === trackEndMin ? "100%" : toPercent(upperMin),
								transform:
									upperMin === trackEndMin
										? "translateX(-100%)"
										: "translateX(-50%)",
							}}
							className="flex flex-col items-center pt-0.5"
							title={`Upper limit: ${minutesToTimeString(upperMin)}`}
						>
							<div className="h-1.5 w-1 rounded-full bg-primary" />
							<span className="whitespace-nowrap font-bold text-[10px] text-primary tabular-nums">
								{formatTime12(upperMin)}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Footer legend / helper info */}
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-border border-t pt-3 text-[11px] text-muted-foreground">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-1.5">
						<span className="size-2.5 rounded-sm bg-primary" />
						<span>Active Time ({formatDuration(durationMin)})</span>
					</div>
					{normalizedBlocked.length > 0 && (
						<div className="flex items-center gap-1.5">
							<span className="size-2.5 rounded-sm bg-destructive/30" />
							<span>Blocked Breaks</span>
						</div>
					)}
					{isBounded && (
						<div className="flex items-center gap-1.5">
							<span className="size-2.5 rounded-sm bg-muted-foreground/30" />
							<span>Buffer / Outside Hours</span>
						</div>
					)}
				</div>

				<span className="italic">Drag to move • Snaps past blocked times</span>
			</div>
		</div>
	);
}

export default DaySlider;
