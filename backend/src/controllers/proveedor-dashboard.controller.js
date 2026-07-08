const pool = require('../config/db');

/**
 * GET /api/proveedor/dashboard
 * Dashboard del proveedor logueado: estadísticas de sus productos y compras.
 */
const getProveedorDashboard = async (req, res, next) => {
  try {
    const proveedorId = req.user.proveedor_id;

    if (!proveedorId) {
      return res.status(400).json({ error: 'Este usuario no tiene un proveedor vinculado.' });
    }

    // Datos de la empresa proveedora
    const proveedorResult = await pool.query(
      'SELECT * FROM proveedores WHERE id = $1', [proveedorId]
    );
    const proveedor = proveedorResult.rows[0];

    // Contar compras donde este proveedor está involucrado
    const comprasResult = await pool.query(
      `SELECT COUNT(*) as total_compras, 
              COALESCE(SUM(total), 0) as monto_total
       FROM compras 
       WHERE proveedor_id = $1 AND estado = 'COMPLETADA'`,
      [proveedorId]
    );

    // Productos que han sido comprados a este proveedor (a través de detalle_compras)
    const productosResult = await pool.query(
      `SELECT DISTINCT dc.producto_id, p.nombre, p.codigo_barras, p.categoria, p.precio
       FROM detalle_compras dc
       JOIN compras c ON dc.compra_id = c.id
       JOIN productos p ON dc.producto_id = p.id
       WHERE c.proveedor_id = $1
       ORDER BY p.nombre ASC`,
      [proveedorId]
    );

    // Últimas compras realizadas a este proveedor
    const ultimasComprasResult = await pool.query(
      `SELECT c.id, c.total, c.fecha_compra, c.estado,
              u.nombre as registrado_por
       FROM compras c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.proveedor_id = $1
       ORDER BY c.fecha_compra DESC
       LIMIT 10`,
      [proveedorId]
    );

    res.json({
      proveedor,
      estadisticas: {
        total_compras: parseInt(comprasResult.rows[0].total_compras),
        monto_total: parseFloat(comprasResult.rows[0].monto_total),
        productos_suministrados: productosResult.rows.length
      },
      productos: productosResult.rows,
      ultimas_compras: ultimasComprasResult.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/proveedor/mis-productos
 * Lista los productos que han sido comprados a este proveedor.
 */
const getMisProductos = async (req, res, next) => {
  try {
    const proveedorId = req.user.proveedor_id;

    if (!proveedorId) {
      return res.status(400).json({ error: 'Este usuario no tiene un proveedor vinculado.' });
    }

    const result = await pool.query(
      `SELECT DISTINCT p.id, p.codigo_barras, p.nombre, p.descripcion, p.categoria, 
              p.precio, p.stock, p.estado,
              COALESCE(SUM(dc.cantidad), 0) as total_suministrado
       FROM detalle_compras dc
       JOIN compras c ON dc.compra_id = c.id
       JOIN productos p ON dc.producto_id = p.id
       WHERE c.proveedor_id = $1
       GROUP BY p.id, p.codigo_barras, p.nombre, p.descripcion, p.categoria, p.precio, p.stock, p.estado
       ORDER BY p.nombre ASC`,
      [proveedorId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/proveedor/mi-perfil
 * Datos de la empresa proveedora vinculada al usuario logueado.
 */
const getMiPerfil = async (req, res, next) => {
  try {
    const proveedorId = req.user.proveedor_id;

    if (!proveedorId) {
      return res.status(400).json({ error: 'Este usuario no tiene un proveedor vinculado.' });
    }

    const provResult = await pool.query(
      'SELECT * FROM proveedores WHERE id = $1', [proveedorId]
    );

    if (provResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }

    const userResult = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    res.json({
      empresa: provResult.rows[0],
      usuario: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/proveedor/mi-perfil
 * Actualiza datos de contacto de la empresa proveedora.
 */
const updateMiPerfil = async (req, res, next) => {
  try {
    const proveedorId = req.user.proveedor_id;

    if (!proveedorId) {
      return res.status(400).json({ error: 'Este usuario no tiene un proveedor vinculado.' });
    }

    const { telefono, direccion } = req.body;

    const result = await pool.query(
      `UPDATE proveedores SET
        telefono = COALESCE($1, telefono),
        direccion = COALESCE($2, direccion),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [telefono, direccion, proveedorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }

    res.json({
      message: 'Perfil actualizado exitosamente.',
      empresa: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProveedorDashboard, getMisProductos, getMiPerfil, updateMiPerfil };
