

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon, StarIcon, MapPinIcon, PhoneIcon,
  CheckBadgeIcon, BriefcaseIcon, ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { axiosUser } from '../../../shared/api/api';
import { Button } from '../../../shared/components/ui/Button';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription, Badge,
} from '../../../shared/components/layout/DashboardContainer';

const StarRating = ({ rating = 1, size = 'sm' }) => {
  const s = size === 'sm' ? 'size-3.5' : 'size-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) =>
        v <= Math.round(rating)
          ? <StarSolid key={v} className={`${s} text-yellow-400`} />
          : <StarIcon key={v} className={`${s} text-gray-300`} />
      )}
      <span className={`text-gray-500 ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
};

export const WorkerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [wRes, pRes, rRes, sRes] = await Promise.all([
          axiosUser.get(`/users/${id}`),
          axiosUser.get(`/PortFolio/${id}`).catch(() => ({ data: { data: [] } })),
          axiosUser.get(`/reviews/worker/${id}`).catch(() => ({ data: { data: [] } })),
          axiosUser.get(`/userSkill/worker/${id}`).catch(() => ({ data: { data: [] } })),
        ]);
        setWorker(wRes.data?.data || wRes.data);
        setPortfolio(pRes.data?.data || []);
        setReviews(rRes.data?.data || []);
        setSkills(sRes.data?.data || []);
      } catch {
        setWorker(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 bg-gray-100 rounded-xl" />
      <div className="h-32 bg-gray-100 rounded-xl" />
    </div>
  );

  if (!worker) return (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="text-gray-500">Trabajador no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
      </CardContent>
    </Card>
  );

  const initials = `${worker.firstName?.[0] ?? ''}${worker.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a resultados
      </button>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {worker.profilePhoto && !worker.profilePhoto.includes('default') ? (
                <img
                  src={worker.profilePhoto}
                  alt={`${worker.firstName} ${worker.lastName}`}
                  className="size-24 rounded-full object-cover ring-4 ring-yellow-400/20"
                />
              ) : (
                <div className="size-24 rounded-full bg-yellow-500 text-gray-900 font-black text-3xl flex items-center justify-center ring-4 ring-yellow-400/20">
                  {initials || '?'}
                </div>
              )}
              {worker.verificationStatus && (
                <CheckBadgeIcon className="absolute -bottom-1 -right-1 size-7 text-green-500 bg-white rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-gray-900">
                    {worker.firstName} {worker.lastName}
                  </h1>
                  <StarRating rating={worker.ratingAverage} size="md" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/messages`)}>
                    <ChatBubbleLeftRightIcon className="size-4" />
                    Mensaje
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                {worker.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="size-4 text-gray-400" />
                    {worker.phone}
                  </span>
                )}
                {worker.address && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-4 text-gray-400" />
                    {worker.address}
                  </span>
                )}
              </div>

              {worker.description && (
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{worker.description}</p>
              )}

              {worker.verificationStatus && (
                <div className="mt-3">
                  <Badge variant="default" className="text-xs">✓ Identidad Verificada</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habilidades */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habilidades</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {skills.length === 0 ? (
                <p className="text-sm text-gray-400">Sin habilidades registradas</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s._id} variant="secondary">
                      {s.skillId?.name || 'Habilidad'}
                      {s.experienceYears > 0 && (
                        <span className="ml-1 text-gray-400">{s.experienceYears}a</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portafolio y reseñas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portafolio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BriefcaseIcon className="size-5 text-yellow-500" />
                Portafolio de Trabajos
              </CardTitle>
              <CardDescription>Trabajos realizados anteriormente</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {portfolio.filter(p => p.status === 'ACTIVE').length === 0 ? (
                <p className="text-sm text-gray-400">Sin trabajos en el portafolio</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolio.filter(p => p.status === 'ACTIVE').map((item) => (
                    <div key={item._id} className="rounded-lg overflow-hidden border border-gray-100 hover:border-yellow-200 transition-colors">
                      {item.imageUrl && !item.imageUrl.includes('no disponible') && (
                        <img
                          src={item.imageUrl}
                          alt="Trabajo"
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="p-3">
                        <p className="text-sm text-gray-700 line-clamp-3">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reseñas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StarSolid className="size-5 text-yellow-400" />
                Reseñas ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400">Sin reseñas aún</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {r.clientId?.firstName || 'Cliente'}
                        </span>
                        <StarRating rating={r.rating} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};