export default function Loader() {
	return (
		<div className="flex h-full items-center justify-center">
			<img
				data-slot="spinner"
				role="status"
				aria-label="Loading"
				src={"/logo-animated.svg"}
			/>
		</div>
	);
}
