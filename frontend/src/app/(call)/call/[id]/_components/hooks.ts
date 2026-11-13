"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/hooks/api";
import { getCallName, setCallName } from "../../_components/call-name";

const POLL_MS = 30_000;

/**
 * Loads the meeting state before joining: the member endpoint when logged in,
 * the guest endpoint otherwise. Redirects straight to the meeting link when
 * one already exists, and keeps an upcoming meeting polled as a safety net
 * next to the countdown's onComplete refetch.
 */
export function usePreflight(id: string, authenticated: boolean) {
	const router = useRouter();

	const memberPreflight = useQuery(
		api.meeting.join.queryOptions({
			input: { id },
			enabled: authenticated,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);
	const guestPreflight = useQuery(
		api.meeting.joinAsGuest.queryOptions({
			input: { id },
			enabled: !authenticated,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);
	const preflight = authenticated ? memberPreflight : guestPreflight;
	const meeting = preflight.data;

	useEffect(() => {
		if (!meeting?.meetingLink) return;

		router.replace(meeting.meetingLink as "/");
	}, [meeting?.meetingLink, router]);

	useEffect(() => {
		if (meeting?.status !== "upcoming") return;

		const interval = setInterval(() => void preflight.refetch(), POLL_MS);
		return () => clearInterval(interval);
	}, [meeting?.status, preflight.refetch]);

	return {
		meeting,
		isPending: preflight.isPending,
		isError: preflight.isError,
		error: preflight.error,
		refetch: preflight.refetch,
	};
}

export type PreflightState = ReturnType<typeof usePreflight>;

/** Only the states the join card can actually render, so startTime/endTime are defined. */
export type CallMeeting = Extract<
	NonNullable<PreflightState["meeting"]>,
	{ status: "live" | "upcoming" }
>;

/** The guest name is stored per meeting in sessionStorage before joining. */
export function useGuestName(id: string) {
	const [name, setName] = useState(() => getCallName(id) ?? "");

	return { name, setName };
}

/**
 * Verifies the meeting is live right before navigating, stores the chosen
 * name, then moves to the joined or guest call view with the current search
 * params intact.
 */
export function useJoin({
	preflight,
	id,
	mode,
	name,
}: {
	preflight: PreflightState;
	id: string;
	mode: "joined" | "guest";
	name: string;
}) {
	const router = useRouter();
	const [joining, setJoining] = useState(false);

	const join = async () => {
		if (!name || joining) return;

		setJoining(true);
		try {
			const latest = await preflight.refetch();
			if (latest.data?.status !== "live") return;

			setCallName(id, name);

			const search = window.location.search;
			router.push(`/call/${id}/${mode}${search}` as "/");
		} finally {
			setJoining(false);
		}
	};

	return { join, joining };
}
