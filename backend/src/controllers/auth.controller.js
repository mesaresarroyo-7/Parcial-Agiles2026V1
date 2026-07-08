const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * POST /api/auth/login
 * Autenticación de usuario con email y password.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    // Buscar usuario en PostgreSQL
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo, proveedor_id FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Comparar contraseña con bcrypt
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        proveedor_id: usuario.proveedor_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        proveedor_id: usuario.proveedor_id || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/perfil
 * Obtener perfil del usuario autenticado.
 */
const getPerfil = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register-proveedor
 * Registra una empresa proveedora + usuario con login en una sola transacción.
 * Solo accesible por admin.
 */
const registerProveedor = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { ruc, razon_social, telefono, email, direccion, password, nombre_contacto } = req.body;

    // Validaciones
    if (!ruc || !razon_social || !email || !password) {
      return res.status(400).json({ error: 'RUC, razón social, email y contraseña son requeridos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Verificar que el email no exista ya
    const emailCheck = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email.' });
    }

    // Verificar que el RUC no exista ya
    const rucCheck = await client.query('SELECT id FROM proveedores WHERE ruc = $1', [ruc]);
    if (rucCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese RUC.' });
    }

    await client.query('BEGIN');

    // 1. Crear empresa proveedora
    const proveedorResult = await client.query(
      `INSERT INTO proveedores (ruc, razon_social, telefono, email, direccion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ruc, razon_social, telefono || null, email, direccion || null]
    );
    const proveedor = proveedorResult.rows[0];

    // 2. Crear usuario con rol 'proveedor' vinculado a la empresa
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const usuarioResult = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, proveedor_id)
       VALUES ($1, $2, $3, 'proveedor', $4) RETURNING id, nombre, email, rol, proveedor_id, created_at`,
      [nombre_contacto || razon_social, email, password_hash, proveedor.id]
    );
    const usuario = usuarioResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Proveedor y usuario creados exitosamente.',
      proveedor,
      usuario
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/auth/usuarios
 * Lista todos los usuarios del sistema (solo admin).
 */
const getUsuarios = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.proveedor_id, u.created_at,
             p.razon_social AS proveedor_empresa, p.ruc AS proveedor_ruc
      FROM usuarios u
      LEFT JOIN proveedores p ON u.proveedor_id = p.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/usuarios/:id
 * Desactiva un usuario (soft delete). Solo admin.
 * No permite desactivarse a sí mismo.
 */
const deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario.' });
    }

    const result = await pool.query(
      `UPDATE usuarios SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, nombre, email, rol`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({
      message: 'Usuario desactivado exitosamente.',
      usuario: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getPerfil, registerProveedor, getUsuarios, deleteUsuario };
