interface StaffStatCardProps {
  label: string;
  value: string | number;
}

/** ProgressCard style from ssample.txt */
export default function StaffStatCard({ label, value }: StaffStatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 min-w-0">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <h3 className="text-xl sm:text-2xl font-bold mt-1.5 text-gray-900">{value}</h3>
    </div>
  );
}
