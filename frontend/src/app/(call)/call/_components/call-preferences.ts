"use client";

import { parseAsBoolean, useQueryStates } from "nuqs";

export function useJoinPreferences() {
	const [preferences, setPreferences] = useQueryStates(
		{
			camera: parseAsBoolean.withDefault(true),
			mic: parseAsBoolean.withDefault(true),
			companion: parseAsBoolean.withDefault(false),
			record: parseAsBoolean.withDefault(false),
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
		record: preferences.record,
		setCamera: (camera: boolean) => setPreferences({ camera }),
		setMic: (mic: boolean) => setPreferences({ mic }),
		setCompanion: (companion: boolean) => setPreferences({ companion }),
		setRecord: (record: boolean) => setPreferences({ record }),
	};
}
