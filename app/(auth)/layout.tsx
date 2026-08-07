export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-primary/15 to-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-lg shadow-primary/30">
            💰
          </div>
          <h1 className="text-2xl font-bold">Финанс</h1>
          <p className="text-sm text-muted">Бюджет и расходы на всех устройствах</p>
        </div>
        {children}
      </div>
    </div>
  );
}
