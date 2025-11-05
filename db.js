const { Pool } = require('pg');

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

module.exports = {
  pool,
  initDatabase,
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
};
