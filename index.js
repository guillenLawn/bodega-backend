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
  createUser 
} = require('./db');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bodega_guadalupe_secret_2024';

// ✅ Probar conexión al iniciar
async function initializeDatabase() {
  try {
    console.log('🔍 Inicializando conexión a la base de datos...');
    await initDatabase();
    await initUsuariosTable(); // ← AÑADIR INICIALIZACIÓN DE USUARIOS
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

// ✅ GET - Obtener todos los productos
app.get('/api/inventory', async (req, res) => {
  try {
    const productos = await getProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST - Crear nuevo producto
app.post('/api/inventory', async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    
    const nuevoProducto = await createProducto({
      nombre: name,
      descripcion: '',
      precio: price,
      stock: quantity,
      categoria: category,
      imagen_url: ''
    });
    
    res.json({ success: true, message: 'Producto agregado correctamente', producto: nuevoProducto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ PUT - Actualizar producto
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price } = req.body;
    
    const productoActualizado = await updateProducto(id, {
      nombre: name,
      descripcion: '',
      precio: price,
      stock: quantity,
      categoria: category,
      imagen_url: ''
    });
    
    res.json({ success: true, message: 'Producto actualizado correctamente', producto: productoActualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ DELETE - Eliminar producto
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const productoEliminado = await deleteProducto(id);
    
    res.json({ success: true, message: 'Producto eliminado correctamente', producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === ENDPOINTS DE AUTENTICACIÓN ===

// POST - Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Validaciones
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Crear usuario
    const nuevoUsuario = await createUser({ email, password, nombre });
    
    // Generar token
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
    if (error.code === '23505') { // Violación de unique constraint
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

    // Buscar usuario
    const usuario = await findUserByEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const bcrypt = require('bcrypt');
    const validPassword = await bcrypt.compare(password, usuario.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
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

// GET - Endpoint temporal para inicializar tabla de usuarios
app.get('/api/auth/setup', async (req, res) => {
  try {
    await initUsuariosTable();
    res.json({ success: true, message: 'Tabla de usuarios inicializada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  await initializeDatabase();
});
