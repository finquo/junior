export type Note = {
	text: string;
	writterBy: string;
	createdAt: string; // ISO 8601
};

export type Address = {
	line1: string;
	line2?: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

export type Schooling =
	| "icse"
	| "cbse"
	| "state"
	| "homeschool"
	| "online"
	| "other"
	| "unknown";
