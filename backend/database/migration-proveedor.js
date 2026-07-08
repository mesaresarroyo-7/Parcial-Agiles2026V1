/**
 * Migración: Soporte para usuarios proveedores
 * 
 * Cambios:
 * 1. Añade 'proveedor' como rol válido en la tabla usuarios
 * 2. Añade columna proveedor_id (FK → proveedores) para vincular usuario ↔ empresa
 * 
 * Ejecutar: node database/migration-proveedor.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔄 Iniciando migración: soporte para usuarios proveedores...\n');

    // 1. Eliminar el CHECK constraint actual del rol
    // Primero buscamos el nombre real del constraint
    const constraintResult = await client.query(`
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'usuarios'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%rol%'
    `);

    if (constraintResult.rows.length > 0) {
      const constraintName = constraintResult.rows[0].conname;
      console.log(`  ✅ Encontrado constraint de rol: ${constraintName}`);
      
      await client.query(`ALTER TABLE usuarios DROP CONSTRAINT ${constraintName}`);
      console.log('  ✅ Constraint de rol eliminado');
    } else {
      console.log('  ⚠️  No se encontró constraint de rol (puede que ya fue migrado)');
    }

    // 2. Añadir nuevo CHECK constraint con 'proveedor'
    await client.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_rol_check 
      CHECK (rol IN ('admin', 'vendedor', 'almacenero', 'proveedor'))
    `);
    console.log('  ✅ Nuevo constraint de rol añadido (incluye "proveedor")');

    // 3. Añadir columna proveedor_id si no existe
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'proveedor_id'
    `);

    if (columnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE usuarios 
        ADD COLUMN proveedor_id integer REFERENCES proveedores(id)
      `);
      console.log('  ✅ Columna proveedor_id añadida a tabla usuarios');
    } else {
      console.log('  ⚠️  Columna proveedor_id ya existe');
    }

    await client.query('COMMIT');
    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error en la migración:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
