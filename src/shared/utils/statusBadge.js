export const STATUS_BADGE = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", divisor: 31536000 },
    { label: "month", divisor: 2592000 },
    { label: "week", divisor: 604800 },
    { label: "day", divisor: 86400 },
    { label: "hour", divisor: 3600 },
    { label: "minute", divisor: 60 },
    { label: "second", divisor: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.divisor);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
      return rtf.format(-count, interval.label);
    }
  }
  return "hace un momento";
};
