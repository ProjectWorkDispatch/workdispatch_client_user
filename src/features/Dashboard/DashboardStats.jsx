import { createElement } from "react";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";

export const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={`${stat.bg} ${stat.border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              {createElement(stat.icon, { className: `size-10 ${stat.color}` })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
