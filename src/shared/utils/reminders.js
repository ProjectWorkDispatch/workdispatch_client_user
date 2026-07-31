const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatMeetingDate = (date) => {
  const now = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' });

  if (isSameDay(date, now)) return `Hoy, ${time}`;
  if (isSameDay(date, tomorrow)) return `Mañana, ${time}`;

  const dayMonth = date.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${dayMonth}, ${time}`;
};

const getIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
};

export function getMeetingReminders(meetings, userId) {
  const now = Date.now();
  const cutoff = now - 2 * 60 * 60 * 1000;

  return meetings
    .filter((m) => m.status === 'CONFIRMED' && m.startTime)
    .filter((m) => new Date(m.startTime).getTime() >= cutoff)
    .map((m) => {
      const isClient = getIdString(m.clientId) === userId;
      const other = isClient ? m.workerId : m.clientId;
      const otherName = other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() : 'la otra persona';
      const date = new Date(m.startTime);

      return {
        id: `meeting-${m._id}`,
        kind: 'meeting',
        title: `Entrevista con ${otherName}`,
        subtitle: m.serviceRequestId?.title || 'Servicio',
        badge: formatMeetingDate(date),
        overdue: date.getTime() < now,
        sortDate: date.getTime(),
        route: isClient ? `/dashboard/my-requests` : `/dashboard/worker-service`,
        state: { openMeetingId: m._id },
      };
    })
    .sort((a, b) => a.sortDate - b.sortDate);
}

export function getWorkerLogReminders(services) {
  const today = startOfDay(new Date());
  const items = [];

  services
    .filter((s) => s.status === 'IN_PROGRESS')
    .forEach((service) => {
      (service.workPlan || []).forEach((day) => {
        if (day.status !== 'PENDING') return;

        const dayOnly = startOfDay(new Date(day.date));
        if (dayOnly.getTime() > today.getTime()) return;

        const isToday = dayOnly.getTime() === today.getTime();
        const diffDays = Math.round((today.getTime() - dayOnly.getTime()) / 86400000);

        items.push({
          id: `worklog-${service._id}-${day.dayNumber}`,
          kind: 'workLog',
          title: `Día ${day.dayNumber}: ${day.description}`,
          subtitle: service.requestId?.title || service.serviceCode || 'Servicio',
          badge: isToday ? 'Vence hoy' : `Atrasado ${diffDays} día${diffDays === 1 ? '' : 's'}`,
          overdue: !isToday,
          sortDate: dayOnly.getTime(),
          route: `/dashboard/worker-service/${service._id}`,
        });
      });
    });

  return items.sort((a, b) => a.sortDate - b.sortDate);
}

export function getClientVerifyReminders(services) {
  const items = [];

  services
    .filter((s) => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED')
    .forEach((service) => {
      (service.workPlan || []).forEach((day) => {
        if (day.status !== 'DONE') return;

        const dayDate = new Date(day.date);
        items.push({
          id: `verify-${service._id}-${day.dayNumber}`,
          kind: 'verifyDay',
          title: `Día ${day.dayNumber}: ${day.description}`,
          subtitle: service.workerId?.firstName
            ? `Marcado por ${service.workerId.firstName}`
            : service.requestId?.title || service.serviceCode || 'Servicio',
          badge: 'Por verificar',
          overdue: false,
          sortDate: dayDate.getTime(),
          route: `/dashboard/my-services/${service._id}`,
        });
      });
    });

  return items.sort((a, b) => a.sortDate - b.sortDate);
}
