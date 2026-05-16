interface StaffStatCardProps {
  label: string;
  value: string | number;
}

/** ProgressCard style from ssample.txt */
export default function StaffStatCard({ label, value }: StaffStatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
    </div>
  );
}
