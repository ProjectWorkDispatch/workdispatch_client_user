export const deriveTrustBadges = (stats, user) => {
  const badges = [];

  if (user?.verificationStatus === true) {
    badges.push({ label: "Verificado", color: "bg-green-100 text-green-700 border-green-200" });
  }

  if (stats.avgResponseTimeHours != null && stats.avgResponseTimeHours <= 2) {
    badges.push({ label: "Respuesta rápida", color: "bg-blue-100 text-blue-700 border-blue-200" });
  }

  if (stats.ratingAverage >= 4.5 && stats.ratingCount >= 10) {
    badges.push({ label: "Top rated", color: "bg-yellow-100 text-yellow-700 border-yellow-200" });
  }

  if (stats.completionRate >= 0.95 && stats.completedJobs >= 5) {
    badges.push({ label: "Profesional confiable", color: "bg-purple-100 text-purple-700 border-purple-200" });
  }

  return badges;
};
