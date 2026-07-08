import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function ProveedorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [perfil, setPerfil] = useState(null);
  const [editingPerfil, setEditingPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ telefono: '', direccion: '' });
  const [message, setMessage] = useState(null);
  const { usuario } = useAuth();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/proveedor/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerfil = async () => {
    try {
      const res = await api.get('/proveedor/mi-perfil');
      setPerfil(res.data);
      setPerfilForm({
        telefono: res.data.empresa.telefono || '',
        direccion: res.data.empresa.direccion || ''
      });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    try {
      await api.put('/proveedor/mi-perfil', perfilForm);
      setMessage({ type: 'success', text: '✅ Perfil actualizado exitosamente.' });
      setEditingPerfil(false);
      fetchPerfil();
      fetchDashboard();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al actualizar.' });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'perfil' && !perfil) {
      fetchPerfil();
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando panel de proveedor...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h2>🏢 Panel de Proveedor</h2>
        <p>Bienvenido, {usuario?.nombre}. {data?.proveedor?.razon_social && `Empresa: ${data.proveedor.razon_social}`}</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Tabs de navegación */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '0'}}>
        {[
          { key: 'dashboard', label: '📊 Dashboard', icon: '' },
          { key: 'productos', label: '📦 Mis Productos', icon: '' },
          { key: 'perfil', label: '👤 Mi Perfil', icon: '' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Dashboard */}
      {activeTab === 'dashboard' && data && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📦</div>
              <div className="stat-info">
                <h3>{data.estadisticas.total_compras}</h3>
                <p>Órdenes Recibidas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">💰</div>
              <div className="stat-info">
                <h3>S/ {data.estadisticas.monto_total.toFixed(2)}</h3>
                <p>Monto Total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">🏪</div>
              <div className="stat-info">
                <h3>{data.estadisticas.productos_suministrados}</h3>
                <p>Productos Suministrados</p>
              </div>
            </div>
          </div>

          {/* Últimas órdenes */}
          <div className="card" style={{marginTop: '24px'}}>
            <h3 className="card-title" style={{marginBottom: '20px'}}>🕐 Últimas Órdenes de Compra</h3>
            {data.ultimas_compras.length === 0 ? (
              <div className="empty-state" style={{padding: '30px'}}>
                <div className="empty-icon">📦</div>
                <h3>Sin órdenes aún</h3>
                <p>Cuando DollarCity le realice compras, aparecerán aquí.</p>
              </div>
            ) : (
              <div className="table-container" style={{border: 'none'}}>
                <table>
                  <thead>
                    <tr>
                      <th>Orden #</th>
                      <th>Total</th>
                      <th>Registrado por</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ultimas_compras.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td style={{fontWeight: 700}}>S/ {parseFloat(c.total).toFixed(2)}</td>
                        <td style={{fontSize: '13px'}}>{c.registrado_por}</td>
                        <td style={{fontSize: '12px'}}>{new Date(c.fecha_compra).toLocaleString('es-PE')}</td>
                        <td><span className={`badge ${c.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}`}>{c.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: Mis Productos */}
      {activeTab === 'productos' && data && (
        <div className="card">
          <h3 className="card-title" style={{marginBottom: '20px'}}>📦 Productos que Suministro</h3>
          {data.productos.length === 0 ? (
            <div className="empty-state" style={{padding: '30px'}}>
              <div className="empty-icon">📦</div>
              <h3>Sin productos aún</h3>
              <p>Los productos aparecerán cuando DollarCity registre compras con su empresa.</p>
            </div>
          ) : (
            <div className="table-container" style={{border: 'none'}}>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productos.map(p => (
                    <tr key={p.producto_id}>
                      <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{p.codigo_barras}</td>
                      <td style={{fontWeight: 600}}>{p.nombre}</td>
                      <td><span className="badge badge-info">{p.categoria || 'General'}</span></td>
                      <td style={{fontWeight: 700}}>S/ {parseFloat(p.precio).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Mi Perfil */}
      {activeTab === 'perfil' && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
          <div className="card">
            <h3 className="card-title" style={{marginBottom: '20px'}}>🏢 Datos de la Empresa</h3>
            {perfil ? (
              editingPerfil ? (
                <form onSubmit={handleUpdatePerfil}>
                  <div className="form-group">
                    <label>RUC</label>
                    <input className="form-control" value={perfil.empresa.ruc} disabled 
                      style={{opacity: 0.6, cursor: 'not-allowed'}} />
                  </div>
                  <div className="form-group">
                    <label>Razón Social</label>
                    <input className="form-control" value={perfil.empresa.razon_social} disabled 
                      style={{opacity: 0.6, cursor: 'not-allowed'}} />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input className="form-control" value={perfilForm.telefono} placeholder="01-1234567"
                      onChange={e => setPerfilForm({...perfilForm, telefono: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Dirección</label>
                    <input className="form-control" value={perfilForm.direccion} placeholder="Av. Principal 123, Lima"
                      onChange={e => setPerfilForm({...perfilForm, direccion: e.target.value})} />
                  </div>
                  <div className="btn-group" style={{marginTop: '8px'}}>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingPerfil(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">💾 Guardar</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div style={{display: 'grid', gap: '12px'}}>
                    <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>RUC</span><div style={{fontWeight: 600, fontFamily: 'monospace'}}>{perfil.empresa.ruc}</div></div>
                    <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Razón Social</span><div style={{fontWeight: 600}}>{perfil.empresa.razon_social}</div></div>
                    <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Teléfono</span><div>{perfil.empresa.telefono || '—'}</div></div>
                    <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Email</span><div>{perfil.empresa.email || '—'}</div></div>
                    <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Dirección</span><div>{perfil.empresa.direccion || '—'}</div></div>
                  </div>
                  <button className="btn btn-secondary" style={{marginTop: '16px'}} onClick={() => setEditingPerfil(true)}>
                    ✏️ Editar Datos de Contacto
                  </button>
                </div>
              )
            ) : (
              <div className="loading-screen" style={{padding: '20px'}}><div className="spinner"></div></div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title" style={{marginBottom: '20px'}}>👤 Datos de Usuario</h3>
            {perfil ? (
              <div style={{display: 'grid', gap: '12px'}}>
                <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Nombre</span><div style={{fontWeight: 600}}>{perfil.usuario.nombre}</div></div>
                <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Email</span><div>{perfil.usuario.email}</div></div>
                <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Rol</span><div><span className="badge badge-primary">🏢 {perfil.usuario.rol}</span></div></div>
                <div><span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Registrado</span><div>{new Date(perfil.usuario.created_at).toLocaleDateString('es-PE')}</div></div>
              </div>
            ) : (
              <div className="loading-screen" style={{padding: '20px'}}><div className="spinner"></div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
