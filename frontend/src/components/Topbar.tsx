'use client';

export default function Topbar() {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="text-xl font-bold text-black">
        🌿 Plants In Garden
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          Welcome back!
        </div>
      </div>
    </div>
  );
}
