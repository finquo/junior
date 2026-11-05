"use client";

import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useJoinPreferences() {
	const [preferences, setPreferences] = useQueryStates(
		{
			camera: parseAsBoolean.withDefault(false),
			mic: parseAsBoolean.withDefault(false),
			companion: parseAsBoolean.withDefault(false),
			virtualBackground: parseAsBoolean.withDefault(false),
			cameraId: parseAsString,
			microphoneId: parseAsString,
			speakerId: parseAsString,
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
		cameraId: preferences.cameraId,
		microphoneId: preferences.microphoneId,
		speakerId: preferences.speakerId,
		setCamera: (camera: boolean) => setPreferences({ camera }),
		setMic: (mic: boolean) => setPreferences({ mic }),
		setCompanion: (companion: boolean) => setPreferences({ companion }),
		setVirtualBackground: (virtualBackground: boolean) =>
			setPreferences({ virtualBackground }),
		setCameraId: (cameraId: string | null) => setPreferences({ cameraId }),
		setMicrophoneId: (microphoneId: string | null) =>
			setPreferences({ microphoneId }),
		setSpeakerId: (speakerId: string | null) => setPreferences({ speakerId }),
	};
}
