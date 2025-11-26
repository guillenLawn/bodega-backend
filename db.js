const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para inicializar la base de datos con datos de prueba
async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos PostgreSQL...');
    
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL,
        categoria VARCHAR(50),
        imagen_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verificar si ya existen datos
    const result = await pool.query('SELECT COUNT(*) FROM productos');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log('📝 Insertando datos de prueba...');
      
      // Insertar datos de prueba para Bodega Guadalupe
      await pool.query(`
        INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES
        ('Arroz Costeño', 'Arroz extra calidad 1kg', 4.50, 100, 'Abarrotes', 'https://via.placeholder.com/150'),
        ('Aceite Primor', 'Aceite vegetal 1L', 12.80, 50, 'Aceites', 'https://via.placeholder.com/150'),
        ('Atún Florida', 'Lata de atún en aceite 170g', 6.50, 80, 'Conservas', 'https://via.placeholder.com/150'),
        ('Fideos Don Vittorio', 'Fideo tallarín 400g', 3.20, 120, 'Abarrotes', 'https://via.placeholder.com/150'),
        ('Leche Gloria', 'Leche evaporada 400g', 4.80, 60, 'Lácteos', 'https://via.placeholder.com/150'),
        ('Azúcar Rubia', 'Azúcar blanca 1kg', 3.80, 90, 'Abarrotes', 'https://via.placeholder.com/150'),
        ('Aceituna La Española', 'Aceituna verdes 200g', 5.50, 40, 'Conservas', 'https://via.placeholder.com/150'),
        ('Café Altomayo', 'Café instantáneo 50g', 8.90, 70, 'Bebidas', 'https://via.placeholder.com/150')
      `);
      
      console.log('✅ Datos de prueba insertados correctamente');
    } else {
      console.log('✅ Base de datos ya contiene datos');
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
}

// Función para inicializar tabla de usuarios
async function initUsuariosTable() {
  try {
    console.log('🔄 Inicializando tabla de usuarios...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol VARCHAR(20) DEFAULT 'cliente',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT true
      )
    `);

    // Verificar si ya existe el usuario admin
    const result = await pool.query('SELECT COUNT(*) FROM usuarios WHERE email = $1', ['admin@bodegaguadalupe.com']);
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log('📝 Insertando usuario administrador...');
      
      // Hash de password: Admin123
      const passwordHash = await bcrypt.hash('Admin123', 10);
      
      await pool.query(
        'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, $3, $4)',
        ['admin@bodegaguadalupe.com', passwordHash, 'Administrador', 'admin']
      );
      
      console.log('✅ Usuario administrador creado correctamente');
    } else {
      console.log('✅ Tabla de usuarios ya inicializada');
    }

  } catch (error) {
    console.error('❌ Error inicializando tabla de usuarios:', error.message);
    throw error;
  }
}

// Función para obtener todos los productos
async function getProductos() {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw error;
  }
}

// Función para obtener producto por ID
async function getProductoById(id) {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw error;
  }
}

// Función para crear nuevo producto
async function createProducto(producto) {
  try {
    const { nombre, descripcion, precio, stock, categoria, imagen_url } = producto;
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, precio, stock, categoria, imagen_url]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creando producto:', error);
    throw error;
  }
}

// Función para actualizar producto
async function updateProducto(id, producto) {
  try {
    const { nombre, descripcion, precio, stock, categoria, imagen_url } = producto;
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, imagen_url = $6 WHERE id = $7 RETURNING *',
      [nombre, descripcion, precio, stock, categoria, imagen_url, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// Función para eliminar producto
async function deleteProducto(id) {
  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

// Función para buscar usuario por email
async function findUserByEmail(email) {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
    return result.rows[0];
  } catch (error) {
    console.error('Error buscando usuario:', error);
    throw error;
  }
}

// Función para crear nuevo usuario
async function createUser(usuario) {
  try {
    const { email, password, nombre, rol = 'cliente' } = usuario;
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, rol',
      [email, passwordHash, nombre, rol]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initDatabase,
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  initUsuariosTable,
  findUserByEmail,
  createUser
};
