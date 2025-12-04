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
    console.log(' Inicializando base de datos PostgreSQL...');
    
    //Agregar nuevos campos para vista detalle**
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        descripcion_larga TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL,
        categoria VARCHAR(50),
        imagen_url VARCHAR(255),
        marca VARCHAR(50),
        peso VARCHAR(20),
        unidad_medida VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verificar si ya existen datos
    const result = await pool.query('SELECT COUNT(*) FROM productos');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log(' Insertando datos de prueba...');
      
      //Datos completos con descripción_larga, marca, peso, unidad_medida**
      await pool.query(`
        INSERT INTO productos (nombre, descripcion, descripcion_larga, precio, stock, categoria, imagen_url, marca, peso, unidad_medida) VALUES
        ('Arroz Costeño Extra', 'Arroz extra calidad 1kg', 
         'Arroz extra calidad Costeño, grano largo y suelto. Ideal para todo tipo de preparaciones como arroz con pollo, arroz chaufa, arroz tapado. Producto peruano de alta calidad cultivado en el norte del país.',
         4.50, 100, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707064/433778_vzoxur.webp', 'Costeño', '1', 'kg'),
        
        ('Aceite Primor Vegetal', 'Aceite vegetal 1L',
         'Aceite vegetal 100% puro de soya, ideal para freír, saltear y preparar aderezos. No contiene colesterol, rico en vitamina E. Perfecto para uso en hogares y restaurantes.',
         12.80, 50, 'Aceites', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707820/Aceite_Primor_Vegetal_sddu5q.webp', 'Primor', '1', 'litro'),
        
        ('Atún Florida en Aceite', 'Lata de atún en aceite 170g',
         'Atún de alta calidad en aceite vegetal, listo para consumir. Rico en proteínas y omega-3. Perfecto para ensaladas, sándwiches, ceviches y pastas. Producto enlatado con todos los estándares de calidad.',
         6.50, 80, 'Conservas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764707920/At%C3%BAn_Florida_en_Aceite_sz6i4j.jpg', 'Florida', '170', 'gramos'),
        
        ('Fideos Don Vittorio Tallarín', 'Fideo tallarín 400g',
         'Fideos tallarín de trigo fortificado, ideales para preparar tallarines rojos, verdes o saltados. Conservan su textura al dente después de la cocción. Harina de trigo enriquecida con vitaminas y minerales.',
         3.20, 120, 'Pastas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764622446/fideos_don_vittorio_zi41xb.png', 'Don Vittorio', '400', 'gramos'),
        
        ('Leche Gloria Evaporada', 'Leche evaporada 400g',
         'Leche evaporada entera, rica en calcio y vitaminas A y D. Ideal para preparar postres, cremas, salsas y bebidas. No necesita refrigeración hasta abrirse. Producto 100% peruano.',
         4.80, 60, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708001/Leche_Gloria_Evaporada_ewhy7c.webp', 'Gloria', '400', 'gramos'),
        
        ('Azúcar Rubia Blanca', 'Azúcar blanca 1kg',
         'Azúcar blanca refinada de caña, perfecta para endulzar bebidas, postres y todo tipo de preparaciones. Grano fino que se disuelve fácilmente. Producto de alta pureza.',
         3.80, 90, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708090/Az%C3%BAcar_Rubia_Blanca_fxxrjc.jpg', 'Rubia', '1', 'kg'),
        
        ('Café Altomayo Instantáneo', 'Café instantáneo 50g',
         'Café instantáneo 100% puro, de granos seleccionados de las zonas altas de Perú. Sabor y aroma intenso, se disuelve instantáneamente en agua caliente. Ideal para el desayuno o después de las comidas.',
         8.90, 70, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708822/Caf%C3%A9_Altomayo_Instant%C3%A1neo_yznpzn.webp', 'Altomayo', '50', 'gramos'),
        
        ('Harina Blanca Flor', 'Harina de trigo 1kg',
         'Harina de trigo blanqueada, ideal para preparar panes, pasteles, tortas y todo tipo de repostería. Textura fina que garantiza resultados profesionales en la cocina.',
         3.50, 85, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764708862/Harina_Blanca_Flor_anaulp.webp', 'Flor', '1', 'kg'),
        
        ('Huevos plancha', '1 plancha de huevo',
         'Huevos frescos tipo A, ricos en proteínas y nutrientes esenciales. Cada plancha contiene 30 huevos cuidadosamente seleccionados. Perfectos para desayunos, postres y todo tipo de preparaciones.',
         24.90, 75, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709082/Huevos_plancha_g6hjah.jpg', 'Granja', '30', 'unidades'),
        
        ('Mantequilla Gloria', 'Mantequilla 250g',
         'Mantequilla 100% natural hecha de crema de leche pasteurizada. Ideal para untar en panes, cocinar y hornear. Sabor suave y cremoso que realza cualquier preparación.',
         7.50, 35, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709741/Mantequilla_Gloria_uoj3uz.webp', 'Gloria', '250', 'gramos'),
        
        ('Yogurt Gloria Natural', 'Yogurt natural 1L',
         'Yogurt natural sin azúcar añadida, rico en probióticos que ayudan a la digestión. Fuente de calcio y proteínas. Consumir solo o con frutas y cereales.',
         6.80, 40, 'Lácteos', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Yogurt_Gloria_Natural_yqghkt.jpg', 'Gloria', '1', 'litro'),
        
        ('Gaseosa Inca Kola', 'Gaseosa 1.5L',
         'La bebida gaseosa de sabor único peruano. Refrescante con el tradicional sabor a hierba luisa. Perfecta para acompañar comidas o disfrutar en cualquier momento.',
         5.50, 70, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Gaseosa_Inca_Kola_fatoqv.webp', 'Inca Kola', '1.5', 'litros'),
        
        ('Agua Cielo Sin Gas', 'Agua mineral 2L',
         'Agua purificada, sin gas, ideal para hidratación diaria. Proceso de purificación avanzado que garantiza pureza y sabor neutral. Envase práctico con tapa segura.',
         3.20, 100, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Agua_Cielo_Sin_Gas_iw3wtc.jpg', 'Cielo', '2', 'litros'),
        
        ('Jugo Pulp Naranja', 'Jugo de naranja 1L',
         'Jugo de naranja con pulpa, 100% natural sin conservantes artificiales. Rico en vitamina C. Sabor refrescante que simula jugo recién exprimido.',
         4.80, 50, 'Bebidas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709740/Jugo_Pulp_Naranja_imxd3c.webp', 'Pulp', '1', 'litro'),
        
        ('Detergente Bolívar', 'Detergente en polvo 750g',
         'Detergente en polvo con tecnología avanzada que elimina las manchas más difíciles. Fragancia fresca que deja la ropa limpia y perfumada. Eficaz en agua fría o caliente.',
         8.50, 40, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Detergente_Bol%C3%ADvar_m6tp7t.jpg', 'Bolívar', '750', 'gramos'),
        
        ('Jabón Líquido Ace', 'Jabón líquido 500ml',
         'Jabón líquido concentrado que remueve la grasa al instante. Elimina el 99.9% de bacterias. Fragancia limón que deja las manos limpias y frescas.',
         6.80, 55, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Jab%C3%B3n_L%C3%ADquido_Ace_pv2iv8.webp', 'Ace', '500', 'ml'),
        
        ('Lavavajillas Sapolio', 'Lavavajillas 500ml',
         'Lavavajillas líquido concentrado que corta la grasa al instante. Ideal para lavar a mano, deja la vajilla brillante y sin residuos. Aroma a limón fresco.',
         5.20, 45, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709740/Lavavajillas_Sapolio_wnsi4f.jpg', 'Sapolio', '500', 'ml'),
        
        ('Papel Higiénico Elite', 'Papel higiénico 4 rollos',
         'Papel higiénico suave y resistente de 3 capas. Ideal para toda la familia. Rollos dobles con núcleo pequeño para mayor rendimiento.',
         7.80, 65, 'Limpieza', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Papel_Higi%C3%A9nico_Elite_hvt4rs.jpg', 'Elite', '4', 'rollos'),
        
        ('Sardina en Salsa de Tomate', 'Sardina en lata 125g',
         'Sardinas en salsa de tomate natural, ricas en omega-3 y proteínas. Listas para consumir en sándwiches, ensaladas o con arroz. Producto enlatado de alta calidad.',
         4.20, 60, 'Conservas', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709745/Sardina_en_Salsa_de_Tomate_i9h6wc.jpg', 'Conservas Perú', '125', 'gramos'),
        
        ('Pan de Molde Bimbo', 'Pan de molde 600g',
         'Pan de molde blanco, suave y esponjoso. Perfecto para sándwiches, tostadas o acompañar comidas. Envasado al vacío para mantener la frescura.',
         8.50, 30, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709741/Pan_de_Molde_Bimbo_ww8gf6.webp', 'Bimbo', '600', 'gramos'),
        
        ('Galletas Soda Field', 'Galletas soda 204g',
         'Galletas soda crujientes, bajas en azúcar. Ideales para acompañar con mantequilla, queso o solo. Textura ligera que se derrite en la boca.',
         18.00, 70, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764709736/Galletas_Soda_Field_tppjoe.webp', 'Field', '204', 'gramos'),
        
        ('Mermelada Gloria Durazno', 'Mermelada de durazno 500g',
         'Mermelada de durazno con trozos de fruta, endulzada naturalmente. Perfecta para panqueques, tostadas o como ingrediente en postres.',
         6.80, 40, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711511/Mermelada_Gloria_Durazno_sujzko.webp', 'Gloria', '500', 'gramos'),
        
        ('Sal de Mesa', 'Sal fina de mesa 1kg',
         'Sal fina yodada, esencial para sazonar todo tipo de comidas. Procesada bajo estrictos controles de calidad. Envase práctico con dispensador.',
         2.00, 85, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711511/Sal_de_Mesa_dullnv.webp', 'Salinas', '1', 'kg'),
        
        ('Vinagre Blanco', 'Vinagre alcohol blanco 500ml',
         'Vinagre blanco destilado, ideal para aderezos, conservas y limpieza. Grado de acidez 5%. Versátil para uso culinario y doméstico.',
         2.80, 60, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711514/Vinagre_Blanco_nxgqah.jpg', 'Cocinero', '500', 'ml'),
        
        ('Chocolate Bon o Bon', 'Chocolate relleno 24 unidades',
         'Chocolates rellenos con maní caramelizado y bañados en chocolate con leche. Presentación familiar perfecta para compartir o regalar.',
         12.50, 40, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711504/Chocolate_Bon_o_Bon_ggth0s.webp', 'Bon o Bon', '24', 'unidades'),
        
        ('Maíz Pop Corn COSTEÑO', 'Maíz pira para hacer canchita 500g',
         'Maíz pira especial para preparar canchita salada o dulce. Granos seleccionados que explotan completamente. Ideal para reuniones familiares o cine en casa.',
         3.50, 55, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711510/Ma%C3%ADz_Pop_Corn_COSTE%C3%91O_sqrryp.jpg', 'Costeño', '500', 'gramos'),
        
        ('Aji-no-sillao', 'Sillao botella 150ml',
         'Salsa de soya oscura, ideal para dar color y sabor a salteados, marinados y sopas. Sabor umami que realza cualquier preparación asiática.',
         4.50, 45, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711503/Ajin%C3%B3mino_wbdxi2.jpg', 'Ajinómoto', '150', 'ml'),
        
        ('Caldo de Gallina Maggi', 'Caldo de gallina 26 un',
         'Cubitos de caldo de gallina concentrado. Realzan el sabor de sopas, guisos, arroces y todo tipo de preparaciones. Prácticos y fáciles de usar.',
         18.00, 60, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711503/Caldo_de_Gallina_Maggi_zryrub.webp', 'Maggi', '26', 'unidades'),
        
        ('Lentejas Partidas', 'Lentejas partidas 500g',
         'Lentejas partidas de cocción rápida, ricas en proteínas y fibra. Ideales para sopas, guisos y ensaladas. No requieren remojo previo.',
         4.20, 40, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711507/Lentejas_Partidas_s1gntw.webp', 'Legumbres Perú', '500', 'gramos'),
        
        ('Garbanzos Secos', 'Garbanzos secos 500g',
         'Garbanzos secos de alta calidad, ideales para preparar guisos, ensaladas o hummus. Ricos en proteínas vegetales y fibra.',
         5.50, 35, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711506/Garbanzos_Secos_plgqtq.webp', 'Legumbres Perú', '500', 'gramos'),
        
        ('Avena Molida', 'Avena molida 400g',
         'Avena molida instantánea, ideal para preparar papillas, batidos o usar en repostería. Rica en fibra soluble que ayuda a la digestión.',
         3.80, 50, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711503/Avena_Molida_xxcez5.jpg', 'Molinos', '400', 'gramos'),
        
        ('Menestrón en Sobres', 'Menestrón en sobres 55g',
         'Sopa instantánea de menestrón con fideos, verduras deshidratadas y condimentos. Lista en 3 minutos. Ideal para una comida rápida y nutritiva.',
         2.50, 70, 'Abarrotes', 'https://res.cloudinary.com/dbptiljzk/image/upload/v1764711511/Menestr%C3%B3n_en_Sobres_ukmj8w.webp', 'Sopas Perú', '55', 'gramos')
      `);
      
      console.log(' Datos completos insertados correctamente');
    } else {
      console.log(' Base de datos ya contiene datos');
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
}

// FUNCIONES  para incluir nuevos campos**

async function getProductos() {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw error;
  }
}

async function getProductoById(id) {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw error;
  }
}

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

// **FUNCIONES PARA MIGRACIÓN **
async function migrarDatosViejosANuevos() {
  try {
    console.log(' Migrando datos a nuevos campos...');
    
    // Actualizar registros que no tengan los nuevos campos completos
    await pool.query(`
      UPDATE productos 
      SET descripcion_larga = descripcion || '. Producto de alta calidad disponible en Bodega Guadalupe.',
          marca = CASE categoria 
            WHEN 'Abarrotes' THEN 'Varios'
            WHEN 'Lácteos' THEN 'Gloria'
            WHEN 'Bebidas' THEN 'Perú'
            WHEN 'Limpieza' THEN 'Hogar'
            WHEN 'Pastas' THEN 'Don Vittorio'
            ELSE 'Genérico'
          END,
          peso = CASE 
            WHEN nombre LIKE '%1kg%' THEN '1'
            WHEN nombre LIKE '%500g%' THEN '500'
            WHEN nombre LIKE '%400g%' THEN '400'
            WHEN nombre LIKE '%1L%' THEN '1'
            WHEN nombre LIKE '%500ml%' THEN '500'
            ELSE '1'
          END,
          unidad_medida = CASE 
            WHEN nombre LIKE '%g%' THEN 'gramos'
            WHEN nombre LIKE '%ml%' THEN 'ml'
            WHEN nombre LIKE '%L%' THEN 'litros'
            WHEN nombre LIKE '%unidades%' THEN 'unidades'
            ELSE 'unidad'
          END
      WHERE descripcion_larga IS NULL OR marca IS NULL
    `);
    
    console.log(' Datos migrados correctamente');
  } catch (error) {
    console.warn(' Advertencia en migración:', error.message);
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
      console.log(' Insertando usuario administrador...');
      
      // Hash de password: Admin123
      const passwordHash = await bcrypt.hash('Admin123', 10);
      
      await pool.query(
        'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, $3, $4)',
        ['admin@bodega.com', passwordHash, 'Administrador', 'admin']
      );
      
      console.log(' Usuario administrador creado correctamente');
    } else {
      console.log(' Tabla de usuarios ya inicializada');
    }

  } catch (error) {
    console.error(' Error inicializando tabla de usuarios:', error.message);
    throw error;
  }
}

async function deleteProducto(id) {
  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

async function findUserByEmail(email) {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
    return result.rows[0];
  } catch (error) {
    console.error('Error buscando usuario:', error);
    throw error;
  }
}

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
  createUser,
  migrarDatosViejosANuevos  
};
