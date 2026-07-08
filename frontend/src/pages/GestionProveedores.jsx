import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export default function GestionProveedores() {
  const [proveedoresUsuarios, setProveedoresUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    ruc: '', razon_social: '', telefono: '', email: '', 
    direccion: '', password: '', nombre_contacto: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/auth/usuarios');
      setProveedoresUsuarios(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      ruc: '', razon_social: '', telefono: '', email: '',
      direccion: '', password: '', nombre_contacto: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage(null);

    try {
      await api.post('/auth/register-proveedor', form);
      setMessage({ type: 'success', text: '✅ Proveedor y usuario creados exitosamente.' });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al registrar proveedor.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDesactivar = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"? Ya no podrá acceder al sistema.`)) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      setMessage({ type: 'success', text: `✅ Usuario "${nombre}" desactivado.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al desactivar.' });
    }
  };

  const getRolBadgeClass = (rol) => {
    switch(rol) {
      case 'admin': return 'badge-danger';
      case 'vendedor': return 'badge-success';
      case 'almacenero': return 'badge-info';
      case 'proveedor': return 'badge-primary';
      default: return 'badge-info';
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando usuarios...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h2>👥 Gestión de Proveedores y Usuarios</h2>
        <p>Registre proveedores con acceso al sistema y administre todos los usuarios</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      <div style={{display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'flex-end'}}>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          ➕ Nuevo Proveedor con Acceso
        </button>
      </div>

      {/* Tabla de todos los usuarios */}
      <div className="card">
        <h3 className="card-title" style={{marginBottom: '20px'}}>📋 Usuarios del Sistema</h3>
        <div className="table-container" style={{border: 'none'}}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Empresa</th>
                <th>RUC</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedoresUsuarios.map(u => (
                <tr key={u.id} style={{opacity: u.activo ? 1 : 0.5}}>
                  <td>#{u.id}</td>
                  <td style={{fontWeight: 600}}>{u.nombre}</td>
                  <td style={{fontSize: '13px'}}>{u.email}</td>
                  <td>
                    <span className={`badge ${getRolBadgeClass(u.rol)}`}>
                      {u.rol === 'proveedor' ? '🏢' : u.rol === 'admin' ? '👑' : u.rol === 'vendedor' ? '🛒' : '📦'} {u.rol}
                    </span>
                  </td>
                  <td style={{fontSize: '13px'}}>{u.proveedor_empresa || '—'}</td>
                  <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{u.proveedor_ruc || '—'}</td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{fontSize: '12px'}}>{new Date(u.created_at).toLocaleDateString('es-PE')}</td>
                  <td>
                    {u.activo && u.rol !== 'admin' && (
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDesactivar(u.id, u.nombre)}
                        title="Desactivar usuario"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3>🏢 Registrar Nuevo Proveedor</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px'}}>
                ℹ️ Se creará la empresa proveedora y un usuario con acceso al sistema en un solo paso.
              </p>

              <div style={{marginBottom: '16px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)'}}>
                <label style={{fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block'}}>
                  📋 Datos de la Empresa
                </label>
                <div className="form-row">
                  <div className="form-group">
                    <label>RUC *</label>
                    <input className="form-control" value={form.ruc} maxLength="11" placeholder="20XXXXXXXXX"
                      onChange={e => setForm({...form, ruc: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Razón Social *</label>
                    <input className="form-control" value={form.razon_social} placeholder="Empresa SAC"
                      onChange={e => setForm({...form, razon_social: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input className="form-control" value={form.telefono} placeholder="01-1234567"
                      onChange={e => setForm({...form, telefono: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Dirección</label>
                    <input className="form-control" value={form.direccion} placeholder="Av. Principal 123, Lima"
                      onChange={e => setForm({...form, direccion: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)'}}>
                <label style={{fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block'}}>
                  🔐 Datos de Acceso al Sistema
                </label>
                <div className="form-group">
                  <label>Nombre de Contacto</label>
                  <input className="form-control" value={form.nombre_contacto} placeholder="Nombre del responsable (opcional)"
                    onChange={e => setForm({...form, nombre_contacto: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email de Acceso *</label>
                    <input type="email" className="form-control" value={form.email} placeholder="contacto@empresa.pe"
                      onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input type="password" className="form-control" value={form.password} placeholder="Mínimo 6 caracteres"
                      onChange={e => setForm({...form, password: e.target.value})} required minLength="6" />
                  </div>
                </div>
              </div>

              <div className="btn-group" style={{justifyContent: 'flex-end', marginTop: '16px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? '⏳ Registrando...' : '🏢 Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
