import { useState, useEffect, useRef } from 'react';
import { UserIcon, CameraIcon, PlusIcon, PencilIcon, EyeSlashIcon, EyeIcon, ArrowUpTrayIcon, FlagIcon } from '@heroicons/react/24/outline';
import { axiosUser } from '../../../shared/api/api';
import { getCreatedReports, getReceivedReports } from '../../../shared/api/user';
import { useAuthStore } from '../../auth/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Modal } from '../../../shared/components/ui/Modal';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Badge,
} from '../../../shared/components/layout/DashboardContainer';
import { sanitizeLettersOnly, sanitizePhone, blockInvalidNumberKeys } from '../../../shared/utils/inputRestrictions.js';
import toast from 'react-hot-toast';

export const MyProfile = () => {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'WORKER';

  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Perfil form
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', address: '', description: '' });
  const [originalForm, setOriginalForm] = useState(form);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoRef = useRef();

  // Portfolio modal
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({ description: '' });
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState(null);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const portfolioImageRef = useRef();
  const [mongoId, setMongoId] = useState(null);

  // Habilidades / Skills (T90)
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [experienceYears, setExperienceYears] = useState('');

  // Reportes
  const [sentReports, setSentReports] = useState([]);
  const [receivedReports, setReceivedReports] = useState([]);
  const [reportsTab, setReportsTab] = useState('received');


  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await axiosUser.get(`/users/by-email/${user?.email}`);
            const u = res.data?.data || res.data;
            setProfile(u);
            setMongoId(u._id);
            const loadedForm = {
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                phone: u.phone || '',
                address: u.address || '',
                description: u.description || '',
            };
            setForm(loadedForm);
            setOriginalForm(loadedForm);
            if (isWorker) {
                const pRes = await axiosUser.get(`/PortFolio/my/${u._id}`).catch(() => ({ data: { data: [] } }));
                setPortfolio(pRes.data?.data || []);

                const [catRes, mySkillsRes] = await Promise.all([
                    axiosUser.get('/skill').catch(() => ({ data: { data: [] } })),
                    axiosUser.get(`/userSkill/my/${u._id}`).catch(() => ({ data: { data: [] } })),
                ]);
                setSkillsCatalog(catRes.data?.data || []);
                setMySkills(mySkillsRes.data?.data || []);
            }

            const [sentRes, receivedRes] = await Promise.all([
                getCreatedReports(u._id).catch(() => ({ data: { reports: [] } })),
                getReceivedReports(u._id).catch(() => ({ data: { reports: [] } })),
            ]);
            setSentReports(sentRes.data?.reports || []);
            setReceivedReports(receivedRes.data?.reports || []);
        } catch {
            toast.error('Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    };
    if (user?.email) fetchData();
}, [user?.email]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleStartEdit = () => {
    setOriginalForm(form);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(originalForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      const textFields = ['firstName', 'lastName', 'phone', 'address', 'description'];
      textFields.forEach(k => {
        if (form[k] !== null && form[k] !== undefined) {
          fd.append(k, form[k]);
        }
      });
      if (photoFile) fd.append('profilePhoto', photoFile);
      const res = await axiosUser.put(`/users/${mongoId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data?.data || res.data;
      setProfile(updated);
      useAuthStore.setState({ user: { ...user, ...updated } });
      setPhotoFile(null);
      setOriginalForm(form);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !experienceYears) {
      toast.error('Selecciona una habilidad y los años de experiencia');
      return;
    }
    try {
      const res = await axiosUser.post('/userSkill', {
        userId: mongoId,
        skillId: selectedSkill,
        experienceYears: Number(experienceYears),
      });
      setMySkills(prev => [...prev, res.data?.data || res.data]);
      setSelectedSkill('');
      setExperienceYears('');
      toast.success('Habilidad agregada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar la habilidad');
    }
  };

  const openAddPortfolio = () => {
    setEditingItem(null);
    setPortfolioForm({ description: '' });
    setPortfolioImage(null);
    setPortfolioImagePreview(null);
    setPortfolioModal(true);
  };

  const openEditPortfolio = (item) => {
    setEditingItem(item);
    setPortfolioForm({ description: item.description || '' });
    setPortfolioImage(null);
    setPortfolioImagePreview(item.imageUrl && !item.imageUrl.includes('no disponible') ? item.imageUrl : null);
    setPortfolioModal(true);
  };

  const handlePortfolioImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortfolioImage(file);
    setPortfolioImagePreview(URL.createObjectURL(file));
  };

  const handleSavePortfolio = async () => {
    if (!portfolioForm.description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    try {
      setSavingPortfolio(true);
      if (editingItem) {
        const res = await axiosUser.put(`/PortFolio/${editingItem._id}`, {
          description: portfolioForm.description,
          workerId: mongoId,
        });
        setPortfolio(prev => prev.map(p => p._id === editingItem._id ? (res.data?.data || res.data) : p));
        toast.success('Trabajo actualizado');
      } else {
        const fd = new FormData();
        fd.append('workerId', mongoId);
        fd.append('description', portfolioForm.description);
        if (portfolioImage) fd.append('image', portfolioImage);
        const res = await axiosUser.post('/PortFolio', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPortfolio(prev => [res.data?.data || res.data, ...prev]);
        toast.success('Trabajo agregado al portafolio');
      }
      setPortfolioModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await axiosUser.patch(`/PortFolio/status/${item._id}`);
      setPortfolio(prev => prev.map(p =>
        p._id === item._id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p
      ));
      toast.success(item.status === 'ACTIVE' ? 'Trabajo desactivado' : 'Trabajo activado');
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase();
  const currentPhoto = photoPreview || (profile?.profilePhoto && !profile.profilePhoto.includes('default') ? profile.profilePhoto : null);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Administra tu información personal</p>
      </div>

      {/* Foto y datos básicos */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-yellow-500" />
              Información Personal
            </CardTitle>
            {!isEditing && (
              <Button size="sm" variant="outline" onClick={handleStartEdit}>
                <PencilIcon className="size-3.5" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Foto de perfil" className="size-20 rounded-full object-cover ring-4 ring-yellow-400/20" />
              ) : (
                <div className="size-20 rounded-full bg-yellow-500 text-gray-900 font-black text-2xl flex items-center justify-center ring-4 ring-yellow-400/20">
                  {initials || '?'}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => photoRef.current?.click()}
                  className="absolute -bottom-1 -right-1 size-7 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors"
                >
                  <CameraIcon className="size-3.5" />
                </button>
              )}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.firstName} {form.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <Badge variant={isWorker ? 'default' : 'secondary'} className="mt-1">
                {isWorker ? 'Trabajador' : 'Cliente'}
              </Badge>
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre', key: 'firstName', placeholder: 'Tu nombre', sanitize: sanitizeLettersOnly },
              { label: 'Apellido', key: 'lastName', placeholder: 'Tu apellido', sanitize: sanitizeLettersOnly },
              { label: 'Teléfono', key: 'phone', placeholder: 'Ej: +502 5555-5555', sanitize: sanitizePhone },
              { label: 'Dirección / Ubicación', key: 'address', placeholder: 'Ciudad, Zona, País' },
            ].map(({ label, key, placeholder, sanitize }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, [key]: sanitize ? sanitize(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            ))}
          </div>

          {isWorker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Descripción profesional</label>
              <textarea
                placeholder="Describe tus habilidades, experiencia y lo que ofreces..."
                value={form.description}
                disabled={!isEditing}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          )}

          {isWorker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Habilidades / Categorías</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {mySkills.map((s) => (
                  <Badge key={s._id} variant="secondary" className="text-xs">
                    {s.skillId?.name} — {s.experienceYears} año{s.experienceYears !== 1 ? 's' : ''}
                  </Badge>
                ))}
                {mySkills.length === 0 && (
                  <p className="text-xs text-gray-400">Aún no agregaste habilidades</p>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">Selecciona una habilidad...</option>
                    {skillsCatalog.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Años"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    onKeyDown={blockInvalidNumberKeys}
                    className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <Button size="sm" onClick={handleAddSkill}>Agregar</Button>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} loading={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portafolio — solo trabajadores (T91) */}
      {isWorker && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Portafolio de Trabajos</CardTitle>
                <CardDescription>Muestra tus trabajos anteriores a potenciales clientes</CardDescription>
              </div>
              <Button size="sm" onClick={openAddPortfolio}>
                <PlusIcon className="size-4" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {portfolio.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ArrowUpTrayIcon className="size-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Aún no tienes trabajos en tu portafolio</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={openAddPortfolio}>
                  Agregar primer trabajo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolio.map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-xl border overflow-hidden transition-all ${
                      item.status === 'ACTIVE' ? 'border-gray-200' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    {item.imageUrl && !item.imageUrl.includes('no disponible') && (
                      <img
                        src={item.imageUrl}
                        alt="Trabajo"
                        className="w-full h-36 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm text-gray-700 line-clamp-2 flex-1">{item.description}</p>
                        <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                          {item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditPortfolio(item)}>
                          <PencilIcon className="size-3" />
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(item)}>
                          {item.status === 'ACTIVE'
                            ? <><EyeSlashIcon className="size-3" /> Desactivar</>
                            : <><EyeIcon className="size-3" /> Activar</>
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal portafolio */}
      <Modal
        open={portfolioModal}
        onClose={() => setPortfolioModal(false)}
        title={editingItem ? 'Editar trabajo' : 'Agregar trabajo al portafolio'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPortfolioModal(false)}>Cancelar</Button>
            <Button onClick={handleSavePortfolio} loading={savingPortfolio}>
              {savingPortfolio ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editingItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto del trabajo</label>
              <div
                onClick={() => portfolioImageRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  portfolioImagePreview ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                {portfolioImagePreview ? (
                  <img src={portfolioImagePreview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                ) : (
                  <div className="py-4">
                    <ArrowUpTrayIcon className="size-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Click para subir una foto</p>
                  </div>
                )}
                <input
                  ref={portfolioImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePortfolioImageChange}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción del trabajo</label>
            <textarea
              placeholder="Describe el trabajo realizado, materiales usados, resultado..."
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{(portfolioForm.description || '').length}/500</p>
          </div>
        </div>
      </Modal>

      {/* Reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlagIcon className="size-5 text-yellow-500" />
            Reportes
          </CardTitle>
          <CardDescription>Reportes enviados y recibidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setReportsTab('received')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportsTab === 'received'
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'
              }`}
            >
              Recibidos ({receivedReports.length})
            </button>
            <button
              onClick={() => setReportsTab('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportsTab === 'sent'
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'
              }`}
            >
              Enviados ({sentReports.length})
            </button>
          </div>

          {reportsTab === 'received' && (
            receivedReports.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No tienes reportes recibidos</p>
            ) : (
              <div className="space-y-3">
                {receivedReports.map((r) => (
                  <div key={r._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        De: {r.reporterId?.firstName || 'Usuario'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{r.Reason}</p>
                    {r.Description && <p className="text-sm text-gray-500 mt-1">{r.Description}</p>}
                  </div>
                ))}
              </div>
            )
          )}

          {reportsTab === 'sent' && (
            sentReports.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No has enviado reportes</p>
            ) : (
              <div className="space-y-3">
                {sentReports.map((r) => (
                  <div key={r._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        Contra: {r.reporteredId?.firstName || 'Usuario'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{r.Reason}</p>
                    {r.Description && <p className="text-sm text-gray-500 mt-1">{r.Description}</p>}
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};