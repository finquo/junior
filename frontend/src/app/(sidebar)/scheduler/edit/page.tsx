import EditProfile from "@/app/(center)/user/edit/page";

export default function () {
	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh items-center justify-start">
			<div className="w-auto md:min-w-96">
				<EditProfile />
			</div>
		</div>
	);
}
