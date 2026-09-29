import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { socials } from "@/lib/social";
import { getInitials } from "@/lib/utils";

export function TeamSwitcher() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
				>
					<Avatar>
						<AvatarImage src={`${socials.github}.png`} alt={socials.name} />
						<AvatarFallback>{getInitials(socials.name)}</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{socials.name}</span>
						<span className="truncate text-xs">{socials.domain}</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
