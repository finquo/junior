import { Container } from "@/components/container";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <Container>{children}</Container>;
}
