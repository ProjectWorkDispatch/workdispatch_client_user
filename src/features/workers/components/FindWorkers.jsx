
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, StarIcon, MapPinIcon, UserCircleIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { axiosUser } from '../../../shared/api/api';
import { Button } from '../../../shared/components/ui/Button';
import {
  Card, CardContent, Badge,
} from '../../../shared/components/layout/DashboardContainer';
import { useAuthStore } from '../../auth/store/authStore';
import { useFavoritesStore } from '../../../shared/store/userStore.js';

const DEFAULT_PHOTO = 'https://ui-avatars.com/api/?background=EAB308&color=111827&size=128&bold=true';

const StarRating = ({ rating = 1 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      s <= Math.round(rating)
        ? <StarSolid key={s} className="size-3.5 text-yellow-400" />
        : <StarIcon key={s} className="size-3.5 text-gray-300 dark:text-gray-600" />
    ))}
    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{Number(rating).toFixed(1)}</span>
  </div>
);

export const FindWorkers = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;
  const { favorites, getMyFavorites, toggleFavorite } = useFavoritesStore();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const wRes = await axiosUser.get('/users');
        const allUsers = wRes.data?.data || wRes.data || [];
        setWorkers(allUsers.filter((u) => u.role === 'WORKER'));
      } catch {
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    if (currentUserId) getMyFavorites(currentUserId);
  }, [currentUserId]);

  const filtered = workers.filter((w) => {
    const matchSearch =
      !search ||
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      w.description?.toLowerCase().includes(search.toLowerCase()) ||
      w.address?.toLowerCase().includes(search.toLowerCase());
    const matchRating = !filterRating || w.ratingAverage >= Number(filterRating);
    const matchFav = viewMode !== 'favoritos' || favorites.some((f) => (f.workerId?._id || f.workerId) === w._id);
    return matchSearch && matchRating && matchFav;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Buscar Trabajadores</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Encuentra profesionales calificados para tus proyectos</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-yellow-500 text-gray-900 dark:text-gray-100'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setViewMode('favoritos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'favoritos'
                ? 'bg-yellow-500 text-gray-900 dark:text-gray-100'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-400'
            }`}
          >
            Favoritos ({favorites.length})
          </button>
        </div>
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">Todas las calificaciones</option>
          <option value="4">4+ estrellas</option>
          <option value="3">3+ estrellas</option>
          <option value="2">2+ estrellas</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} trabajador{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCircleIcon className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron trabajadores</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Intenta con otros filtros de búsqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((worker) => {
            const initials = `${worker.firstName?.[0] ?? ''}${worker.lastName?.[0] ?? ''}`.toUpperCase();
            return (
              <Card
                key={worker._id}
                className="hover:shadow-md hover:border-yellow-200 transition-all duration-200 cursor-pointer relative"
                onClick={() => navigate(`/dashboard/worker/${worker._id}`)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentUserId) toggleFavorite(currentUserId, worker._id);
                  }}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  {favorites.some((f) => (f.workerId?._id || f.workerId) === worker._id) ? (
                    <HeartSolid className="size-5 text-red-500" />
                  ) : (
                    <HeartIcon className="size-5 text-gray-400 dark:text-gray-500 hover:text-red-400" />
                  )}
                </button>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {worker.profilePhoto && !worker.profilePhoto.includes('default') ? (
                        <img
                          src={worker.profilePhoto}
                          alt={`${worker.firstName} ${worker.lastName}`}
                          className="size-14 rounded-full object-cover ring-2 ring-yellow-400/30"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div
                        className="size-14 rounded-full bg-yellow-500 text-gray-900 dark:text-gray-100 font-black text-lg flex items-center justify-center ring-2 ring-yellow-400/30"
                        style={{ display: worker.profilePhoto && !worker.profilePhoto.includes('default') ? 'none' : 'flex' }}
                      >
                        {initials || '?'}
                      </div>
                      {worker.verificationStatus && (
                        <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                        {worker.firstName} {worker.lastName}
                      </h3>
                      <StarRating rating={worker.ratingAverage} />
                      {worker.address && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPinIcon className="size-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{worker.address}</span>
                        </div>
                      )}
                      {worker.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{worker.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    {worker.verificationStatus ? (
                      <Badge variant="default" className="text-[10px]">✓ Verificado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Sin verificar</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/worker/${worker._id}`); }}>
                      Ver perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};