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
        ('Arroz Costeño Extra', 'Arroz extra calidad 1kg', 4.50, 100, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707064/433778_vzoxur.webp'),
        ('Aceite Primor Vegetal', 'Aceite vegetal 1L', 12.80, 50, 'Aceites', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707820/Aceite_Primor_Vegetal_sddu5q.webp'),
        ('Atún Florida en Aceite', 'Lata de atún en aceite 170g', 6.50, 80, 'Conservas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707920/At%C3%BAn_Florida_en_Aceite_sz6i4j.jpg'),
        ('Fideos Don Vittorio Tallarín', 'Fideo tallarín 400g', 3.20, 120, 'Pastas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764622446/fideos_don_vittorio_zi41xb.png'),
        ('Leche Gloria Evaporada', 'Leche evaporada 400g', 4.80, 60, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708001/Leche_Gloria_Evaporada_ewhy7c.webp'),
        ('Azúcar Rubia Blanca', 'Azúcar blanca 1kg', 3.80, 90, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708090/Az%C3%BAcar_Rubia_Blanca_fxxrjc.jpg'),
        ('Café Altomayo Instantáneo', 'Café instantáneo 50g', 8.90, 70, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708822/Caf%C3%A9_Altomayo_Instant%C3%A1neo_yznpzn.webp'),
        ('Harina Blanca Flor', 'Harina de trigo 1kg', 3.50, 85, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708862/Harina_Blanca_Flor_anaulp.webp'),
        ('Huevos plancha ', '1 plancha de huevo', 24.90, 75, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709082/Huevos_plancha_g6hjah.jpg'),
        ('Mantequilla Gloria', 'Mantequilla 250g', 7.50, 35, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709741/Mantequilla_Gloria_uoj3uz.webp'),
        ('Yogurt Gloria Natural', 'Yogurt natural 1L', 6.80, 40, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Yogurt_Gloria_Natural_yqghkt.jpg'),
        ('Gaseosa Inca Kola', 'Gaseosa 1.5L', 5.50, 70, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Gaseosa_Inca_Kola_fatoqv.webp'),
        ('Agua Cielo Sin Gas', 'Agua mineral 2L', 3.20, 100, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Agua_Cielo_Sin_Gas_iw3wtc.jpg'),
        ('Jugo Pulp Naranja', 'Jugo de naranja 1L', 4.80, 50, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709740/Jugo_Pulp_Naranja_imxd3c.webp'),
        ('Detergente Bolívar', 'Detergente en polvo 750g', 8.50, 40, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Detergente_Bol%C3%ADvar_m6tp7t.jpg'),
        ('Jabón Líquido Ace', 'Jabón líquido 500ml', 6.80, 55, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Jab%C3%B3n_L%C3%ADquido_Ace_pv2iv8.webp'),
        ('Lavavajillas Sapolio', 'Lavavajillas 500ml', 5.20, 45, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709740/Lavavajillas_Sapolio_wnsi4f.jpg'),
        ('Papel Higiénico Elite', 'Papel higiénico 4 rollos', 7.80, 65, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Papel_Higi%C3%A9nico_Elite_hvt4rs.jpg'),
        ('Sardina en Salsa de Tomate', 'Sardina en lata 125g', 4.20, 60, 'Conservas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Sardina_en_Salsa_de_Tomate_i9h6wc.jpg'),
        ('Pan de Molde Bimbo', 'Pan de molde 600g', 8.50, 30, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709741/Pan_de_Molde_Bimbo_ww8gf6.webp'),
        ('Galletas Soda Field', 'Galletas soda 204g', 18, 70, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Galletas_Soda_Field_tppjoe.webp'),
        ('Mermelada Gloria Durazno', 'Mermelada de durazno 500g', 6.80, 40, 'Abarrotes', 'https://example.com/mermelada.jpg'),
        ('Sal de Mesa Finita', 'Sal fina de mesa 1kg', 2.00, 85, 'Abarrotes', 'https://example.com/sal.jpg'),
        ('Vinagre Blanco', 'Vinagre alcohol blanco 500ml', 2.80, 60, 'Abarrotes', 'https://example.com/vinagre.jpg'),
        ('Chocolate Bon o Bon', 'Chocolate relleno 24 unidades', 12.50, 40, 'Abarrotes', 'https://example.com/bonobon.jpg'),
        ('Maíz Pira para Palomitas', 'Maíz pira para hacer canchita 200g', 3.50, 55, 'Abarrotes', 'https://example.com/maiz_pira.jpg'),
        ('Ajinómino', 'Sillao botella 200ml', 4.50, 45, 'Abarrotes', 'https://example.com/sillao.jpg'),
        ('Caldo de Gallina Maggi', 'Caldo de gallina 12 cubos', 3.80, 60, 'Abarrotes', 'https://example.com/caldo.jpg'),
        ('Lentejas Partidas', 'Lentejas partidas 500g', 4.20, 40, 'Abarrotes', 'https://example.com/lentejas.jpg'),
        ('Garbanzos Secos', 'Garbanzos secos 500g', 5.50, 35, 'Abarrotes', 'https://example.com/garbanzos.jpg'),
        ('Avena Molida', 'Avena molida 400g', 3.80, 50, 'Abarrotes', 'https://example.com/avena.jpg'),
        ('Menestrón en Sobres', 'Menestrón en sobres 80g', 2.50, 70, 'Abarrotes', 'https://example.com/menestron.jpg')
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
    const result = await pool.query('SELECT COUNT(*) FROM usuarios WHERE email = $1', ['admin@bodega.com']);
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log('📝 Insertando usuario administrador...');
      
      // Hash de password: Admin123
      const passwordHash = await bcrypt.hash('Admin123', 10);
      
      await pool.query(
        'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, $3, $4)',
        ['admin@bodega.com', passwordHash, 'Administrador', 'admin']
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
