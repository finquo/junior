/**
 * Build target for AWS (Lambda + Function URL).
 *
 * The Cloudflare target (`open-next.config.ts`) overrides the wrapper to
 * `cloudflare-node` and the converter to `edge`. Those expect a Fetch API
 * `Request`, not a Lambda event, so building for AWS with that config makes
 * the handler fail on `new URL(undefined)`. An empty `default` leaves OpenNext
 * on its AWS defaults: `aws-lambda` wrapper + `aws-apigw-v2` converter.
 *
 * The cache overrides are deliberately disabled: without an S3 cache bucket,
 * a DynamoDB tag table and an SQS revalidation queue the defaults fire failing
 * AWS calls on every render ("InvalidToken"/"NoSuchBucket" with no bucket
 * configured). Static assets are served by CloudFront from S3, not by the ISR
 * cache, so nothing here needs them today.
 */
export default {
	default: {
		override: {
			incrementalCache: "dummy",
			tagCache: "dummy",
			queue: "dummy",
		},
	},
};
