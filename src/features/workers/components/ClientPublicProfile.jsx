import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, StarIcon as StarOutline, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { axiosUser } from "../../../shared/api/api";
import { getClientTrustStats } from "../../../shared/api/user";

const StarRow = ({ rating = 0 }) => {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rounded ? (
          <StarSolid key={s} className="size-4 text-yellow-400" />
        ) : (
          <StarOutline key={s} className="size-4 text-yellow-400" />
        )
      )}
      <span className="ml-1 text-sm text-gray-500">{Number(rating).toFixed(1)}</span>
    </div>
  );
};

const getArrayFromResponse = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  const possibleKeys = ["data", "reviews"];
  for (const key of possibleKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const ClientPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      axiosUser.get(`/users/${id}`),
      getClientTrustStats(id).catch(() => null),
      axiosUser.get(`/reviews/received/${id}`).catch(() => null),
    ])
      .then(([uRes, sRes, rRes]) => {
        setClient(uRes.data?.data || uRes.data);
        if (sRes?.data?.success) setStats(sRes.data.data);
        setReviews(rRes ? getArrayFromResponse(rRes) : []);
      })
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-semibold text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-gray-700">Cliente no encontrado</p>
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900">
          Volver
        </button>
      </div>
    );
  }

  const initials = `${client.firstName?.[0] ?? ""}${client.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="size-4" />
        Volver
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {client.profilePhoto && !client.profilePhoto.includes("default") ? (
              <img src={client.profilePhoto} alt="" className="size-20 rounded-full object-cover" />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-yellow-400">
                <span className="text-2xl font-bold text-gray-900">{initials || "?"}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              {stats && <StarRow rating={stats.ratingAverage} />}
              {client.verificationStatus && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckBadgeIcon className="size-4" />
                  Verificado
                </span>
              )}
            </div>
          </div>

          {client.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">{client.description}</p>
          )}

          <div className="mt-4 space-y-2">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>&#9742;</span>
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>&#9906;</span>
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-bold text-gray-900">Estadisticas de confianza</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                <span className="text-2xl font-black text-gray-900">
                  {stats.completionRate != null ? `${Math.round(stats.completionRate * 100)}%` : "—"}
                </span>
                <span className="mt-1 text-center text-xs text-gray-500">Trabajos completados</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                <span className="text-2xl font-black text-gray-900">
                  {stats.reportRate != null ? `${Math.round(stats.reportRate * 100)}%` : "—"}
                </span>
                <span className="mt-1 text-center text-xs text-gray-500">Reportes recibidos</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                <span className="text-2xl font-black text-gray-900">
                  {stats.ratingCount != null ? `${stats.ratingCount}` : "0"}
                </span>
                <span className="mt-1 text-center text-xs text-gray-500">Reseñas recibidas</span>
              </div>
            </div>
            {stats.memberSince && (
              <p className="mt-4 text-center text-xs italic text-gray-400">
                Miembro desde {new Date(stats.memberSince).toLocaleDateString("es-GT", { year: "numeric", month: "long" })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-bold text-gray-900">Reseñas ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-sm italic text-gray-400">Sin reseñas aun</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">
                      {r.workerId?.firstName || "Trabajador"}
                    </p>
                    <StarRow rating={r.Rating || r.rating} />
                  </div>
                  {(r.Comment || r.comment) && (
                    <p className="mt-1 text-sm text-gray-600">{r.Comment || r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
