const express = require('express');
const router = express.Router();
const { getProveedorDashboard, getMisProductos, getMiPerfil, updateMiPerfil } = require('../controllers/proveedor-dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Todas las rutas requieren autenticación + rol proveedor
router.use(authMiddleware, roleMiddleware('proveedor'));

// GET /api/proveedor/dashboard
router.get('/dashboard', getProveedorDashboard);

// GET /api/proveedor/mis-productos
router.get('/mis-productos', getMisProductos);

// GET /api/proveedor/mi-perfil
router.get('/mi-perfil', getMiPerfil);

// PUT /api/proveedor/mi-perfil
router.put('/mi-perfil', updateMiPerfil);

module.exports = router;
