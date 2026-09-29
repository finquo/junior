import type { USER } from "backend/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export const UserList = ({
	user,
	children,
}: {
	user: USER | null;
	children?: React.ReactNode;
}) => {
	if (!user) return;

	return (
		<div>
			<div className="flex flex-row items-center justify-between">
				<div className="flex flex-1 flex-row items-center gap-2">
					<Avatar className="size-10">
						<AvatarImage src={user.image} />
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					</Avatar>
					<div className="flex flex-1 flex-col">
						<p>{user.name}</p>
						<div className="flex flex-row items-center gap-0.5">
							<p className="align-text-top text-muted-foreground">
								{user.email}
							</p>
						</div>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
};
