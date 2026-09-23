export type Quiz = {
	question: string;
} & (
	| {
			type: "choices";
			choices: string[];
			anwser: string[];
	  }
	| {
			type: "options";
			options: string[];
			anwser: string;
	  }
	| {
			type: "text";
			anwser: string;
	  }
);

export type Anwser =
	| {
			type: "choices";
			anwser: string[];
	  }
	| {
			type: "options";
			anwser: string;
	  }
	| {
			type: "text";
			anwser: string;
	  };
