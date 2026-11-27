import { BufferingIndicator, Controls, Time, Tooltip } from "@videojs/react";
import type { ComponentProps } from "react";

import { AirPlayButton } from "@/components/videojs/ui/airplay-button";
import { ButtonTooltip } from "@/components/videojs/ui/button-tooltip";
import { CaptionsButton } from "@/components/videojs/ui/captions-button";
import { CastButton } from "@/components/videojs/ui/cast-button";
import { FullscreenButton } from "@/components/videojs/ui/fullscreen-button";
import { PiPButton } from "@/components/videojs/ui/pip-button";
import { PlayButton } from "@/components/videojs/ui/play-button";
import { SeekButton } from "@/components/videojs/ui/seek-button";
import { TimeSlider } from "@/components/videojs/ui/time-slider";
import { VolumePopover } from "@/components/videojs/ui/volume-popover";
import { cn } from "@/lib/resolve-class-name";

import { VideoSettingsMenu } from "../menus/settings-menu";

export interface DefaultVideoControlsProps {
	renderThumbnail?: NonNullable<
		ComponentProps<typeof TimeSlider>
	>["renderThumbnail"];
}

export function DefaultVideoControls({
	renderThumbnail,
}: DefaultVideoControlsProps = {}) {
	return (
		<Controls.Root>
			<BufferingIndicator className={"group/buffering contents"}>
				<Controls.Group
					className={cn(
						"group/center -translate-1/2 pointer-events-none absolute top-1/2 left-1/2 z-30 flex items-center gap-6 rtl:flex-row-reverse",
						"transition-[filter,opacity,scale] duration-media-controls-enter ease-out",
						"not-data-visible:scale-media-hidden not-data-visible:opacity-0 not-data-visible:duration-media-controls",
						"pointer-fine:not-data-visible:blur-media-hidden",
						"group-data-visible/buffering:hidden",
					)}
				>
					<SeekButton
						className={cn(
							"pointer-events-auto group-not-data-visible/center:pointer-events-none",
							"media-max-2xs:hidden! pointer-fine:hidden! group-not-data-started/center:hidden!",
							"rounded-media-pill!",
							"bg-media-primary! media-high-contrast:bg-media-primary! text-media-primary-foreground!",
							"hover:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
							"focus-visible:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
						)}
						seconds={-10}
					/>
					<PlayButton
						className={cn(
							"pointer-events-auto group-not-data-visible/center:pointer-events-none",
							"rounded-media-pill!",
							"size-auto! media-max-360:p-3! p-4!",
							"bg-media-primary! media-high-contrast:bg-media-primary! text-media-primary-foreground!",
							"hover:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
							"focus-visible:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
							"pointer-fine:data-started:not-focus-visible:opacity-0!",
							"pointer-fine:data-started:not-focus-visible:pointer-events-none!",
						)}
						iconClassName={"size-media-icon-lg! media-max-360:size-media-icon!"}
					/>
					<SeekButton
						className={cn(
							"pointer-events-auto group-not-data-visible/center:pointer-events-none",
							"media-max-2xs:hidden! pointer-fine:hidden! group-not-data-started/center:hidden!",
							"rounded-media-pill!",
							"bg-media-primary! media-high-contrast:bg-media-primary! text-media-primary-foreground!",
							"hover:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
							"focus-visible:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!",
						)}
						seconds={10}
					/>
				</Controls.Group>
			</BufferingIndicator>
			<Controls.Backdrop
				className={cn(
					"pointer-events-none absolute inset-0 z-10 rounded-[inherit]",
					"bg-(image:--media-controls-gradient) bg-bottom bg-size-[100%_var(--media-controls-bottom-gradient-height)] bg-no-repeat",
					"not-data-visible:opacity-0 transition-opacity duration-media-controls ease-out",
					"not-data-started:[visibility:var(--media-controls-before-start,hidden)]",
					"media-before-start-fade:not-data-started:opacity-0",
					"media-max-lg:before:absolute media-max-lg:before:inset-x-0 media-max-lg:before:top-0",
					"media-max-lg:before:bg-(image:--media-controls-top-gradient) media-max-lg:before:h-(--media-controls-gradient-height)",
				)}
			/>
			<Controls.Content
				className={cn(
					"video-controls",
					"group/controls text-media-controls-foreground text-shadow-media",
					"duration-media-controls-enter ease-out",
					"not-data-started:[visibility:var(--media-controls-before-start,hidden)]",
					"media-before-start-fade:not-data-started:opacity-0",
					"contents p-1 transition-[filter,opacity,scale,translate]",
					"media-lg:absolute media-lg:inset-x-2 media-lg:bottom-2 media-lg:z-30",
					"media-lg:flex media-lg:items-center media-lg:rounded-media-controls media-lg:rtl:flex-row-reverse",
					"media-lg:bg-media-popover media-lg:text-media-popover-foreground",
					"media-lg:surface-media media-lg:after:surface-media-inset",
					"media-2xl:inset-x-3 media-2xl:bottom-3",
					"media-lg:not-data-visible:pointer-events-none media-lg:not-data-visible:opacity-0",
					"media-lg:not-data-visible:translate-y-media-hidden-offset media-lg:not-data-visible:scale-media-hidden",
					"media-lg:pointer-fine:not-data-visible:blur-media-hidden",
					"media-lg:not-data-visible:duration-media-controls",
				)}
			>
				<Tooltip.Provider>
					<Controls.Group
						className={cn(
							"absolute inset-x-2 bottom-2 z-30 flex origin-bottom items-center rounded-media-controls p-0.5 rtl:flex-row-reverse",
							"media-max-lg:bg-media-popover media-max-lg:text-media-popover-foreground",
							"media-max-lg:surface-media media-max-lg:after:surface-media-inset",
							"media-lg:contents",
							"media-max-lg:group-[:not([data-visible])]/controls:pointer-events-none",
							"media-max-lg:group-[:not([data-visible])]/controls:opacity-0",
							"media-max-lg:group-[:not([data-visible])]/controls:scale-media-hidden",
							"media-max-lg:pointer-fine:group-[:not([data-visible])]/controls:blur-media-hidden",
							"transition-[filter,opacity,scale,translate] duration-media-controls-enter ease-out",
							"media-max-lg:group-[:not([data-visible])]/controls:duration-media-controls",
							"media-max-lg:group-[:not([data-visible])]/controls:translate-y-media-hidden-offset",
							"media-max-4xs:right-auto!",
						)}
					>
						<ButtonTooltip side="top">
							<PlayButton />
						</ButtonTooltip>
						<VolumePopover className={"ms-px"} />

						<Controls.Group
							className={cn(
								"flex flex-1 items-center gap-2.5 media-lg:px-3 px-2 rtl:flex-row-reverse",
								"media-max-3xs:pr-3.5",
								"media-max-4xs:flex-none",
							)}
						>
							<Time.Value
								className={cn(
									"tabular-nums transition-opacity duration-media-slow ease-out data-unavailable:opacity-50",
									"media-4xs:media-max-2xs:hidden!",
								)}
								type="current"
							/>
							<TimeSlider
								className={"media-max-4xs:hidden min-w-0!"}
								renderThumbnail={renderThumbnail}
							/>
							<Time.Value
								className={cn(
									"focus-ring-media cursor-pointer rounded-sm tabular-nums",
									"aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
									"transition-[outline-color,outline-offset] duration-media-fast ease-out",
									"focus-visible:outline-media-ring focus-visible:outline-offset-2",
									"media-max-sm:hidden",
								)}
								type="remaining"
								toggle
							/>
						</Controls.Group>

						<ButtonTooltip side="top">
							<CaptionsButton className={"media-max-lg:hidden"} />
						</ButtonTooltip>
						<VideoSettingsMenu
							className={"media-lg:ms-px media-max-3xs:hidden"}
						/>
					</Controls.Group>

					<Controls.Group
						className={cn(
							"absolute top-2 right-2 z-30 flex origin-top items-center gap-px rounded-media-controls p-0.5 rtl:flex-row-reverse",
							"media-max-lg:bg-media-popover media-max-lg:text-media-popover-foreground",
							"media-max-lg:surface-media media-max-lg:after:surface-media-inset",
							"media-lg:static media-lg:p-0",
							"media-max-lg:group-[:not([data-visible])]/controls:pointer-events-none",
							"media-max-lg:group-[:not([data-visible])]/controls:opacity-0",
							"media-max-lg:group-[:not([data-visible])]/controls:scale-media-hidden",
							"media-max-lg:pointer-fine:group-[:not([data-visible])]/controls:blur-media-hidden",
							"transition-[filter,opacity,scale,translate] duration-media-controls-enter ease-out",
							"media-max-lg:group-[:not([data-visible])]/controls:duration-media-controls",
							"media-max-lg:group-[:not([data-visible])]/controls:-translate-y-media-hidden-offset",
							"media-max-4xs:hidden",
						)}
					>
						<ButtonTooltip side="top">
							<CastButton />
						</ButtonTooltip>
						<ButtonTooltip side="top">
							<AirPlayButton />
						</ButtonTooltip>
						<ButtonTooltip side="top">
							<PiPButton />
						</ButtonTooltip>
						<ButtonTooltip side="top">
							<FullscreenButton />
						</ButtonTooltip>
					</Controls.Group>
				</Tooltip.Provider>
			</Controls.Content>
		</Controls.Root>
	);
}
