const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { 
  initDatabase, 
  getProductos, 
  getProductoById, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  initUsuariosTable,
  findUserByEmail,
  createUser,
  migrarDatosViejosANuevos  // 🔧 NUEVO: Importar función de migración
} = require('./db');

const app = express();

// ✅ IMPORTANTE: Solo usar el puerto de Render
const PORT = process.env.PORT;

// Middlewares
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bodega_guadalupe_secret_2024';

// 🔧 CREAR USUARIO ADMIN POR DEFECTO AL INICIAR
async function createDefaultAdmin() {
  try {
    const { pool } = require('./db');
    
    // Verificar si ya existe un admin
    const adminCheck = await pool.query(
      'SELECT id FROM usuarios WHERE rol = $1 LIMIT 1',
      ['admin']
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('👑 No hay administradores, creando uno por defecto...');
      
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        `INSERT INTO usuarios (email, password_hash, nombre, rol, activo) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['superadmin@bodega.com', passwordHash, 'Super Administrador', 'admin', true]
      );
      
      console.log('✅ Usuario admin por defecto creado: superadmin@bodega.com / admin123');
    } else {
      console.log('✅ Ya existen administradores en el sistema');
    }
  } catch (error) {
    console.log('⚠️ Error creando admin por defecto:', error.message);
  }
}

// ✅ Probar conexión al iniciar
async function initializeDatabase() {
  try {
    console.log('🔍 Inicializando conexión a la base de datos...');
    await initDatabase();
    await initUsuariosTable();
    await createDefaultAdmin();
    
    // 🔧 NUEVO: Ejecutar migración de datos viejos a nuevos campos
    await migrarDatosViejosANuevos();
    
    console.log('✅ Aplicación lista para usar');
    return true;
  } catch (error) {
    console.log('❌ No se pudo inicializar la base de datos');
    return false;
  }
}

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Se requieren privilegios de administrador' });
  }
};

// ==================== ENDPOINTS PRINCIPALES ====================

// ✅ GET - Obtener todos los productos (NUEVO: Incluye campos completos)
app.get('/api/inventory', async (req, res) => {
  try {
    const productos = await getProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 🔧 NUEVO: GET - Obtener producto por ID con todos los detalles
app.get('/api/inventory/:id/detalles', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await getProductoById(id);
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({
      success: true,
      producto: producto
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ POST - Crear nuevo producto (ACTUALIZADO: Campos completos)
app.post('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      descripcion_larga, 
      precio, 
      stock, 
      categoria, 
      imagen_url,
      marca,
      peso,
      unidad_medida 
    } = req.body;
    
    const nuevoProducto = await createProducto({
      nombre,
      descripcion: descripcion || '',
      descripcion_larga: descripcion_larga || descripcion || '',
      precio,
      stock,
      categoria,
      imagen_url: imagen_url || '',
      marca: marca || 'Varios',
      peso: peso || '1',
      unidad_medida: unidad_medida || 'unidad'
    });
    
    res.json({ 
      success: true, 
      message: 'Producto agregado correctamente', 
      producto: nuevoProducto 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ PUT - Actualizar producto (ACTUALIZADO: Campos completos)
app.put('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      descripcion_larga, 
      precio, 
      stock, 
      categoria, 
      imagen_url,
      marca,
      peso,
      unidad_medida 
    } = req.body;
    
    const productoActualizado = await updateProducto(id, {
      nombre,
      descripcion: descripcion || '',
      descripcion_larga: descripcion_larga || descripcion || '',
      precio,
      stock,
      categoria,
      imagen_url: imagen_url || '',
      marca: marca || 'Varios',
      peso: peso || '1',
      unidad_medida: unidad_medida || 'unidad'
    });
    
    res.json({ 
      success: true, 
      message: 'Producto actualizado correctamente', 
      producto: productoActualizado 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ DELETE - Eliminar producto
app.delete('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const productoEliminado = await deleteProducto(id);
    
    res.json({ 
      success: true, 
      message: 'Producto eliminado correctamente', 
      producto: productoEliminado 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AUTENTICACIÓN ====================

// POST - Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const nuevoUsuario = await createUser({ email, password, nombre });
    
    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST - Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await findUserByEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const bcrypt = require('bcrypt');
    const validPassword = await bcrypt.compare(password, usuario.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// GET - Inicializar tabla de usuarios
app.get('/api/auth/setup', async (req, res) => {
  try {
    await initUsuariosTable();
    res.json({ success: true, message: 'Tabla de usuarios inicializada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TABLAS DE PEDIDOS ====================

app.get('/api/setup-pedidos-tables', async (req, res) => {
  try {
    const { pool } = require('./db');
    
    console.log('🔧 Creando tablas de pedidos...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        total DECIMAL(10,2) NOT NULL,
        estado VARCHAR(20) DEFAULT 'completado',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        direccion_entrega TEXT,
        metodo_pago VARCHAR(50) DEFAULT 'efectivo',
        notas TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS detalle_pedidos (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id),
        producto_nombre VARCHAR(255) NOT NULL,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);

    console.log('✅ Tablas de pedidos creadas exitosamente');
    res.json({ 
      success: true, 
      message: 'Tablas de pedidos creadas exitosamente' 
    });

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear tablas: ' + error.message 
    });
  }
});

// ==================== ENDPOINTS DE PEDIDOS ====================

app.post('/api/pedidos', authenticateToken, async (req, res) => {
  const { pool } = require('./db');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const usuarioId = req.user.id;
    const { items, total, direccion, metodoPago } = req.body;

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (usuario_id, total, direccion_entrega, metodo_pago) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuarioId, total, direccion, metodoPago || 'efectivo']
    );

    const pedido = pedidoResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_pedidos (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pedido.id, item.id, item.nombre, item.cantidad, item.precio, item.precio * item.cantidad]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.id]
      );
    }

    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      message: 'Pedido creado exitosamente',
      pedido: pedido
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando pedido:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el pedido: ' + error.message 
    });
  } finally {
    client.release();
  }
});

app.get('/api/pedidos/usuario', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const usuarioId = req.user.id;
    
    const pedidosResult = await pool.query(`
      SELECT p.*, 
             json_agg(
                 json_build_object(
                     'producto_id', dp.producto_id,
                     'producto_nombre', dp.producto_nombre,
                     'cantidad', dp.cantidad,
                     'precio_unitario', dp.precio_unitario,
                     'subtotal', dp.subtotal
                 )
             ) as items
      FROM pedidos p
      LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
      WHERE p.usuario_id = $1
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
    `, [usuarioId]);

    res.json({
      success: true,
      pedidos: pedidosResult.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener pedidos: ' + error.message 
    });
  }
});

app.get('/api/pedidos/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('./db');
    
    const pedidosResult = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email,
             json_agg(
                 json_build_object(
                     'producto_id', dp.producto_id,
                     'producto_nombre', dp.producto_nombre,
                     'cantidad', dp.cantidad,
                     'precio_unitario', dp.precio_unitario,
                     'subtotal', dp.subtotal
                 )
             ) as items
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
      GROUP BY p.id, u.id
      ORDER BY p.fecha_creacion DESC
    `);

    res.json({
      success: true,
      pedidos: pedidosResult.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo todos los pedidos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener pedidos: ' + error.message 
    });
  }
});

app.put('/api/pedidos/:id/estado', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('./db');
    const { id } = req.params;
    const { estado } = req.body;

    await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2',
      [estado, id]
    );

    res.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar estado: ' + error.message 
    });
  }
});

// ==================== ESTADÍSTICAS ====================

app.get('/api/estadisticas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('./db');
    
    console.log('📊 Solicitando estadísticas para admin...');

    const productosQuery = await pool.query('SELECT COUNT(*) as total FROM productos');
    const totalProductos = parseInt(productosQuery.rows[0].total);

    const pedidosQuery = await pool.query('SELECT COUNT(*) as total FROM pedidos');
    const totalPedidos = parseInt(pedidosQuery.rows[0].total);

    const usuariosQuery = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const totalUsuarios = parseInt(usuariosQuery.rows[0].total);

    const ingresosQuery = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado = $1', 
      ['completado']
    );
    const ingresosTotales = parseFloat(ingresosQuery.rows[0].total);

    console.log('✅ Estadísticas calculadas:', {
      totalProductos,
      totalPedidos, 
      totalUsuarios,
      ingresosTotales
    });

    res.json({
      success: true,
      estadisticas: {
        totalProductos,
        totalPedidos,
        totalUsuarios,
        ingresosTotales
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas: ' + error.message 
    });
  }
});

// ==================== DEBUG ====================

app.get('/api/debug/tablas', async (req, res) => {
  try {
    const { pool } = require('./db');
    
    console.log('🔍 Obteniendo información de la base de datos...');
    
    const tablasQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tablas = tablasQuery.rows.map(row => row.table_name);
    console.log('📊 Tablas encontradas:', tablas);
    
    const resultado = {};
    
    for (const tabla of tablas) {
      const countQuery = await pool.query(`SELECT COUNT(*) as total FROM "${tabla}"`);
      const totalRegistros = countQuery.rows[0].total;
      
      const columnasQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tabla]);
      
      const datosQuery = await pool.query(`SELECT * FROM "${tabla}" LIMIT 2`);
      
      resultado[tabla] = {
        total_registros: parseInt(totalRegistros),
        columnas: columnasQuery.rows,
        datos_ejemplo: datosQuery.rows
      };
    }
    
    res.json({
      success: true,
      total_tablas: tablas.length,
      nombres_tablas: tablas,
      detalles: resultado
    });
    
  } catch (error) {
    console.error('Error obteniendo tablas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== ADMIN MANAGEMENT ====================

app.post('/api/auth/create-admin-user', async (req, res) => {
  try {
    const { email = 'superadmin@bodega.com', password = 'admin123', nombre = 'Super Admin' } = req.body;

    console.log('👑 Creando usuario administrador...');

    const nuevoUsuario = await createUser({ 
      email, 
      password, 
      nombre,
      rol: 'admin'
    });
    
    const token = jwt.sign(
      { 
        id: nuevoUsuario.id, 
        email: nuevoUsuario.email, 
        rol: nuevoUsuario.rol 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '✅ Usuario ADMINISTRADOR creado exitosamente',
      token,
      user: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      },
      credentials: {
        email: nuevoUsuario.email,
        password: 'admin123'
      }
    });

  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/convert-to-admin', async (req, res) => {
  try {
    const { pool } = require('./db');
    const { email = 'admin@bodega.com' } = req.body;
    
    console.log('👑 Convirtiendo usuario a administrador:', email);
    
    const result = await pool.query(
      `UPDATE usuarios SET rol = 'admin' WHERE email = $1 RETURNING id, email, nombre, rol`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado: ' + email 
      });
    }
    
    const usuario = result.rows[0];
    
    console.log('✅ Usuario convertido a admin:', usuario);
    
    res.json({
      success: true,
      message: '✅ Usuario convertido a ADMINISTRADOR exitosamente',
      user: usuario
    });
    
  } catch (error) {
    console.error('❌ Error convirtiendo usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/auth/reset-admin-password', async (req, res) => {
  try {
    const { pool } = require('./db');
    const bcrypt = require('bcrypt');
    
    console.log('🔧 Reseteando contraseña de admin...');
    
    const newPassword = 'admin123';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE usuarios SET password_hash = $1 WHERE email = $2 RETURNING id, email, nombre, rol`,
      [passwordHash, 'admin@bodega.com']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin no encontrado' });
    }
    
    const usuario = result.rows[0];
    
    console.log('✅ Contraseña de admin actualizada');
    
    res.json({
      success: true,
      message: '✅ Contraseña de ADMIN actualizada exitosamente',
      user: usuario,
      new_credentials: {
        email: 'admin@bodega.com',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 🆕 ENDPOINT PARA REINICIAR PRODUCTOS (CORREGIDO) ====================

app.post('/api/reset-productos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('./db');
    
    console.log('🔄 Reiniciando productos desde db.js...');
    
    // 1. Eliminar en orden (para evitar errores de FK)
    await pool.query('DELETE FROM detalle_pedidos');
    await pool.query('DELETE FROM pedidos');
    await pool.query('DELETE FROM productos');
    
    // 2. Resetear secuencias
    await pool.query('ALTER SEQUENCE productos_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE pedidos_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE detalle_pedidos_id_seq RESTART WITH 1');
    
    // 3. ✅ IMPORTANTE: Usar initDatabase() que YA tiene los 32 productos actualizados en db.js
    await initDatabase();
    
    console.log('✅ 32 productos insertados correctamente desde db.js');
    
    res.json({
      success: true,
      message: '32 productos reseteados correctamente desde db.js',
      total_productos: 32
    });
    
  } catch (error) {
    console.error('❌ Error reiniciando productos:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== 🆕 REINICIO NUCLEAR (OPCIONAL) ====================

app.post('/api/nuclear-reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('./db');
    
    console.log('☢️ REINICIO NUCLEAR de la base de datos...');
    
    // 1. Eliminar todas las tablas en orden
    await pool.query('DROP TABLE IF EXISTS detalle_pedidos CASCADE');
    await pool.query('DROP TABLE IF EXISTS pedidos CASCADE');
    await pool.query('DROP TABLE IF EXISTS productos CASCADE');
    await pool.query('DROP TABLE IF EXISTS usuarios CASCADE');
    
    console.log('✅ Tablas eliminadas');
    
    // 2. Volver a crear TODO desde cero usando db.js
    await initDatabase(); // Esto creará productos con las URLs ACTUALIZADAS de db.js
    await initUsuariosTable();
    
    // 3. Crear admin
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO usuarios (email, password_hash, nombre, rol, activo) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin@bodega.com', passwordHash, 'Administrador', 'admin', true]
    );
    
    console.log('✅ Base de datos recreada con 32 productos ACTUALIZADOS desde db.js');
    
    res.json({
      success: true,
      message: '✅ Base de datos recreada completamente con URLs actualizadas desde db.js'
    });
    
  } catch (error) {
    console.error('❌ Error nuclear:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== NUEVO ENDPOINT PARA VISTA DETALLE ====================

// 🔧 NUEVO: Endpoint específico para vista detalle
app.get('/api/productos/:id/detalle-completo', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Solicitando detalles completos del producto ID: ${id}`);
    
    const producto = await getProductoById(id);
    
    if (!producto) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado' 
      });
    }
    
    // 🔧 Asegurar que todos los campos existan (compatibilidad hacia atrás)
    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      descripcion_larga: producto.descripcion_larga || producto.descripcion || 'Descripción no disponible',
      precio: producto.precio || 0,
      stock: producto.stock || 0,
      categoria: producto.categoria || 'Sin categoría',
      imagen_url: producto.imagen_url || '',
      marca: producto.marca || 'Varios',
      peso: producto.peso || '1',
      unidad_medida: producto.unidad_medida || 'unidad',
      created_at: producto.created_at
    };
    
    console.log(`✅ Detalles completos enviados para: ${productoCompleto.nombre}`);
    
    res.json({
      success: true,
      producto: productoCompleto
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo detalles del producto:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== INICIAR SERVIDOR ====================

if (PORT) {
  app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    await initializeDatabase();
  });
} else {
  console.error('❌ ERROR: No se especificó el puerto en process.env.PORT');
}
