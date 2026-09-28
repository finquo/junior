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
	schedulers: publicProcedure.handler(() => [
		{
			title: "Schedulers 1",
			id: "0987654321",
		},
		{
			title: "Schedulers 2",
			id: "1234567890",
		},
	]),
	teachers: publicProcedure.handler(() => [
		{
			title: "Teachers 1",
			id: "0987654321",
		},
		{
			title: "Teachers 2",
			id: "1234567890",
		},
	]),
	students: publicProcedure.handler(() => [
		{
			title: "Students 1",
			id: "0987654321",
		},
		{
			title: "Students 2",
			id: "1234567890",
		},
	]),
	slots: publicProcedure.handler(() => [
		{
			title: "Slots 1",
			id: "0987654321",
		},
		{
			title: "Slots 2",
			id: "1234567890",
		},
	]),
};
