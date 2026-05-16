/** Shared panel wrapper — matches ssample.txt card style */
export function StaffPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function StaffSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>;
}
