import type { Participant } from "@zoom/videosdk";
import type { useSessionUsers } from "@zoom/videosdk-react";

export const MAX_REMOTE_TILES = 3;

export const VIRTUAL_BACKGROUND = "/background.png";

export type SessionUser = ReturnType<typeof useSessionUsers>[number];

export function participantName(participant: Participant) {
	return participant.displayName || "Guest";
}

export function participantRole(participant: Participant) {
	return participant.userIdentity || participant.userKey;
}

export function roleLabel(role: string) {
	const label = role.replaceAll("_", " ");

	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isVoiceOn(participant: Participant) {
	return participant.audio !== "" && participant.muted === false;
}

export function sdkErrorDescription(error: unknown) {
	if (error instanceof Error) return error.message;

	if (
		typeof error === "object" &&
		error !== null &&
		"reason" in error &&
		typeof error.reason === "string"
	) {
		return error.reason;
	}

	return undefined;
}
