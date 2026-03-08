import { MainLayout } from "@/components/MainLayout";

export default function PromoBannersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayout>{children}</MainLayout>;
}


