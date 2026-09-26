import { publicProcedure } from "../procedure";

export const sidebarRouter = {
	example: publicProcedure.handler(() => [
		{
			title: "Rajat",
			id: "1234567890",
		},
		{
			title: "Rajat Sandeep",
			id: "0987654321",
		},
	]),
	teachers: publicProcedure.handler(() => [
		{
			title: "Rajat",
			id: "1234567890",
		},
		{
			title: "Rajat Sandeep",
			id: "0987654321",
		},
	]),
};
