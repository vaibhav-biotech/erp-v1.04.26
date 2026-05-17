'use client';

import StaffStatCard from '@/components/staff/StaffStatCard';
import {
  ANALYTICS_PERIOD_LABELS,
  type AnalyticsPeriod,
} from '@/lib/staffContactList';

interface StaffContactsAnalyticsProps {
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
  totalContacts: number;
  calledInPeriod: number;
  pendingCallback: number;
}

export default function StaffContactsAnalytics({
  period,
  onPeriodChange,
  totalContacts,
  calledInPeriod,
  pendingCallback,
}: StaffContactsAnalyticsProps) {
  const notCalledInPeriod = Math.max(0, totalContacts - calledInPeriod);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overview</p>
        <div className="flex rounded-2xl border border-gray-200 p-0.5 bg-gray-50">
          {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
                period === p
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {ANALYTICS_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StaffStatCard label="Total contacts" value={totalContacts.toLocaleString()} />
        <StaffStatCard
          label={`Called (${ANALYTICS_PERIOD_LABELS[period].toLowerCase()})`}
          value={calledInPeriod.toLocaleString()}
        />
        <StaffStatCard
          label={`Not called (${ANALYTICS_PERIOD_LABELS[period].toLowerCase()})`}
          value={notCalledInPeriod.toLocaleString()}
        />
        <StaffStatCard label="Callback pending" value={pendingCallback.toLocaleString()} />
      </div>
    </div>
  );
}
