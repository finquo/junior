declare module "vtt-to-json" {
	export interface VttToJsonCue {
		/** Cue identifier, if present in the VTT file. */
		identifier?: string;
		/** Raw start timestamp, e.g. "00:00:01.000" */
		start: string;
		/** Raw end timestamp, e.g. "00:00:03.500" */
		end: string;
		/** Cue text; may contain newline characters for multi-line cues. */
		text: string;
		[key: string]: unknown;
	}

	function vttToJson(vtt: string): Promise<VttToJsonCue[]>;

	export default vttToJson;
}
