import { handle, type LambdaContext, type LambdaEvent } from "@hono/aws-lambda";
import { Hono } from "hono";
import { transcribeS3Object } from "./aws/event";
import api from "./index";

type Bindings = {
	event: LambdaEvent;
};

const app = new Hono<{ Bindings: Bindings }>();

// app.get("/Hello", (c) => c.text("World"));

app.route("/", api);

const lambdaHandler = handle(app);

export const handler = async (event: any, context: LambdaContext) => {
	if (event?.Records?.[0]?.eventSource === "aws:s3") {
		const record = event.Records[0];

		const bucketName = record.s3.bucket.name as string;
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

		return transcribeS3Object(bucketName, key);
	}

	return lambdaHandler(event, context);
};
