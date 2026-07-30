export const STATUS_BADGE = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DONE: "bg-green-100 text-green-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
};

export const STATUS_LABELS = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  DONE: 'Completado',
  CONFIRMED: 'Confirmada',
};

export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const units = [
    { singular: 'año', plural: 'años', divisor: 31536000 },
    { singular: 'mes', plural: 'meses', divisor: 2592000 },
    { singular: 'semana', plural: 'semanas', divisor: 604800 },
    { singular: 'día', plural: 'días', divisor: 86400 },
    { singular: 'hora', plural: 'horas', divisor: 3600 },
    { singular: 'minuto', plural: 'minutos', divisor: 60 },
  ];

  for (const unit of units) {
    const count = Math.floor(diffInSeconds / unit.divisor);
    if (count >= 1) {
      return `hace ${count} ${count === 1 ? unit.singular : unit.plural}`;
    }
  }
  return 'hace un momento';
};

export const getCategoryName = (req) => {
  if (req.categoryId && typeof req.categoryId === 'object') return req.categoryId.name;
  if (req.customCategory) return req.customCategory;
  return 'Sin categoría';
};
