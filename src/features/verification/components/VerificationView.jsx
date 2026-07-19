import { useState, useEffect, useRef } from 'react';
import { ShieldCheckIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { axiosUser } from '../../../shared/api/api';
import { useAuthStore } from '../../auth/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../../../shared/components/layout/DashboardContainer';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  PENDING:  { label: 'Pendiente de revisión', icon: ClockIcon,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',  badge: 'default' },
  APPROVED: { label: 'Verificación aprobada', icon: CheckCircleIcon,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200',    badge: 'default' },
  REJECTED: { label: 'Verificación rechazada', icon: XCircleIcon,     color: 'text-red-600',    bg: 'bg-red-50 border-red-200',        badge: 'destructive' },
};

export const VerificationView = () => {
  const { user } = useAuthStore();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ documentType: '', documentNumber: '' });
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const frontRef = useRef();
  const backRef = useRef();

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await axiosUser.get(`/verifications/${user?._id || user?.id}`);
        setVerification(res.data?.data || res.data);
      } catch {
        setVerification(null);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchVerification();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.documentType || !form.documentNumber || !frontFile || !backFile) {
      toast.error('Por favor completa todos los campos y sube ambas fotos del documento');
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('userId', user?._id || user?.id);
      fd.append('documentType', form.documentType);
      fd.append('documentNumber', form.documentNumber);
      fd.append('documentImageFront', frontFile);
      fd.append('documentImageBack', backFile);
      const res = await axiosUser.post('/verifications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVerification(res.data?.data || res.data);
      toast.success('Solicitud de verificación enviada exitosamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  const status = verification ? STATUS_CONFIG[verification.status] : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Verificación de Identidad</h1>
        <p className="text-gray-600 mt-1">Sube tu documento para obtener la insignia de cuenta verificada</p>
      </div>

      {/* Estado actual */}
      {verification && status && (
        <Card className={`border-2 ${status.bg}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <status.icon className={`size-10 ${status.color} flex-shrink-0`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-bold ${status.color}`}>{status.label}</p>
                  <Badge variant={status.badge}>{verification.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Tipo: <span className="font-medium">{verification.documentType}</span> —
                  N°: <span className="font-medium">{verification.documentNumber}</span>
                </p>
                {verification.rejectionReason && (
                  <p className="text-sm text-red-600 mt-1">
                    Motivo: {verification.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario — solo si no hay verificación pendiente o aprobada */}
      {(!verification || verification.status === 'REJECTED') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-yellow-500" />
              {verification?.status === 'REJECTED' ? 'Volver a solicitar verificación' : 'Solicitar verificación'}
            </CardTitle>
            <CardDescription>
              Tu documento será revisado por nuestro equipo. El proceso toma 1-2 días hábiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de documento</label>
              <select
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
              >
                <option value="">Selecciona el tipo...</option>
                <option value="DPI">DPI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Licencia de conducir">Licencia de conducir</option>
              </select>
            </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de documento</label>
              <input
                type="text"
                placeholder="Ej: 2345 67890 1234"
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Fotos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Frente del documento', ref: frontRef, file: frontFile, setter: setFrontFile },
                { label: 'Reverso del documento', ref: backRef, file: backFile, setter: setBackFile },
              ].map(({ label, ref, file, setter }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div
                    onClick={() => ref.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      file ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                    }`}
                  >
                    {file ? (
                      <div>
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-md mb-2"
                        />
                        <p className="text-xs text-yellow-700 font-medium truncate">{file.name}</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <ArrowUpTrayIcon className="size-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Click para subir imagen</p>
                        <p className="text-xs text-gray-400">JPG, PNG hasta 5MB</p>
                      </div>
                    )}
                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setter(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button fullWidth onClick={handleSubmit} loading={submitting}>
              <ShieldCheckIcon className="size-4" />
              {submitting ? 'Enviando...' : 'Enviar solicitud de verificación'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};