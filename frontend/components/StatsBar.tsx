"use client";

interface StatsBarProps {
  totalImported: number;
  totalSkipped: number;
}

/**
 * Statistics bar showing import/skip/total counts as gradient cards.
 */
export default function StatsBar({
  totalImported,
  totalSkipped,
}: StatsBarProps) {
  const total = totalImported + totalSkipped;

  const stats = [
    {
      label: "Successfully Imported",
      value: totalImported,
      icon: "✅",
      bgClass:
        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      borderClass: "border-green-200 dark:border-green-800/50",
      textClass: "text-green-700 dark:text-green-400",
    },
    {
      label: "Skipped",
      value: totalSkipped,
      icon: "⏭️",
      bgClass:
        "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20",
      borderClass: "border-red-200 dark:border-red-800/50",
      textClass: "text-red-700 dark:text-red-400",
    },
    {
      label: "Total Processed",
      value: total,
      icon: "📊",
      bgClass:
        "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      borderClass: "border-blue-200 dark:border-blue-800/50",
      textClass: "text-blue-700 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-slide-up">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${stat.bgClass} ${stat.borderClass}`}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <span className="text-3xl">{stat.icon}</span>
          <div>
            <p className={`text-2xl font-bold ${stat.textClass}`}>
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
