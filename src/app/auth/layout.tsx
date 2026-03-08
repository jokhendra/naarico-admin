export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
} 