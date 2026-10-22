"use client";

import { parseAsBoolean, useQueryState } from "nuqs";

const options = {
	history: "replace",
	clearOnDefault: true,
} as const;

const cameraParser = parseAsBoolean.withOptions(options).withDefault(true);
const micParser = parseAsBoolean.withOptions(options).withDefault(true);
const companionParser = parseAsBoolean.withOptions(options).withDefault(false);

export function useJoinPreferences() {
	const [camera, setCamera] = useQueryState("camera", cameraParser);
	const [mic, setMic] = useQueryState("mic", micParser);
	const [companion, setCompanion] = useQueryState("companion", companionParser);

	return { camera, setCamera, mic, setMic, companion, setCompanion };
}
