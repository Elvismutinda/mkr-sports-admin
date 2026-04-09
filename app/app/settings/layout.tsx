export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col gap-4">
      <h2 className={"text-2xl font-bold"}>Settings</h2>
      {children}
    </main>
  );
}
