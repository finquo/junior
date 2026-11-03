"use client";

import { parseAsBoolean, useQueryStates } from "nuqs";

export function useJoinPreferences() {
	const [preferences, setPreferences] = useQueryStates(
		{
			camera: parseAsBoolean.withDefault(false),
			mic: parseAsBoolean.withDefault(false),
			companion: parseAsBoolean.withDefault(false),
			virtualBackground: parseAsBoolean.withDefault(false),
		},
		{
			history: "replace",
			clearOnDefault: true,
		},
	);

	return {
		camera: preferences.camera,
		mic: preferences.mic,
		companion: preferences.companion,
		virtualBackground: preferences.virtualBackground,
		setCamera: (camera: boolean) => setPreferences({ camera }),
		setMic: (mic: boolean) => setPreferences({ mic }),
		setCompanion: (companion: boolean) => setPreferences({ companion }),
		setVirtualBackground: (virtualBackground: boolean) =>
			setPreferences({ virtualBackground }),
	};
}
