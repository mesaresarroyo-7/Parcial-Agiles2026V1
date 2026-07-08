const express = require('express');
const router = express.Router();
const { login, getPerfil, registerProveedor, getUsuarios, deleteUsuario } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { loginRateLimit } = require('../middlewares/rateLimit.middleware');

// POST /api/auth/login (con rate limit anti fuerza bruta)
router.post('/login', loginRateLimit, login);

// GET /api/auth/perfil (protegido)
router.get('/perfil', authMiddleware, getPerfil);

// POST /api/auth/register-proveedor (solo admin)
router.post('/register-proveedor', authMiddleware, roleMiddleware('admin'), registerProveedor);

// GET /api/auth/usuarios (solo admin)
router.get('/usuarios', authMiddleware, roleMiddleware('admin'), getUsuarios);

// DELETE /api/auth/usuarios/:id (solo admin)
router.delete('/usuarios/:id', authMiddleware, roleMiddleware('admin'), deleteUsuario);

module.exports = router;

