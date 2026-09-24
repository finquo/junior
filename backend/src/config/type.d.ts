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

export type Experience = {
	title: string; // e.g. "Senior Math Teacher"
	organization: string; // e.g. "Greenwood High School"
	description?: string; // optional details
	startedAt: string; // ISO date
	endedAt?: string; // ISO date or undefined if current
	writtenBy: string; // who recorded/updated this entry
	createdAt: string; // ISO timestamp of this version
};
