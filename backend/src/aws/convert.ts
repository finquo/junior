import {
	CreateJobCommand,
	type CreateJobCommandInput,
	MediaConvertClient,
} from "@aws-sdk/client-mediaconvert";
import {
	AWS_REGION,
	MEDIA_CONVERT_ENDPOINT,
	MEDIA_CONVERT_QUEUE_ARN,
	MEDIA_CONVERT_ROLE_ARN,
} from "./config";

export const mediaConvert = new MediaConvertClient({
	region: AWS_REGION,
	endpoint: MEDIA_CONVERT_ENDPOINT,
});

export async function createJob(settings: CreateJobCommandInput["Settings"]) {
	const { Job } = await mediaConvert.send(
		new CreateJobCommand({
			Role: MEDIA_CONVERT_ROLE_ARN,
			Queue: MEDIA_CONVERT_QUEUE_ARN,
			Settings: settings,
		}),
	);

	return { jobId: Job?.Id, status: Job?.Status };
}
