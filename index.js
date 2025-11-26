const express = require('express');
const cors = require('cors');
const { initDatabase, getProductos, getProductoById, createProducto, updateProducto, deleteProducto } = require('./db');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión al iniciar
async function initializeDatabase() {
  try {
    console.log('🔍 Inicializando conexión a la base de datos...');
    await initDatabase();
    console.log('Aplicación lista para usar');
    return true;
  } catch (error) {
    console.log('❌ No se pudo inicializar la base de datos');
    return false;
  }
}

// GET - Obtener todos los productos
app.get('/api/inventory', async (req, res) => {
  try {
    const productos = await getProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  POST - Crear nuevo producto
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

//  PUT - Actualizar producto
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

// DELETE - Eliminar producto
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const productoEliminado = await deleteProducto(id);
    
    res.json({ success: true, message: 'Producto eliminado correctamente', producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  await initializeDatabase();
});
