import { createElement } from "react";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { motion } from "framer-motion";

export const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <Card className={`${stat.bg} ${stat.border} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                {createElement(stat.icon, { className: `size-10 ${stat.color}` })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
