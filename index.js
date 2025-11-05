const express = require('express');
const cors = require('cors');
const { getConnection, sql } = require('./db');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Probar conexión al iniciar
async function initializeDatabase() {
  try {
    console.log('🔍 Inicializando conexión a la base de datos...');
    const pool = await getConnection();
    console.log('✅ Aplicación lista para usar');
    return true;
  } catch (error) {
    console.log('❌ No se pudo inicializar la base de datos');
    return false;
  }
}

// ✅ GET - Obtener todos los productos
app.get('/api/inventory', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Inventory');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST - Crear nuevo producto
app.post('/api/inventory', async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    
    const pool = await getConnection();
    await pool.request()
      .input('name', sql.VarChar, name)
      .input('category', sql.VarChar, category)
      .input('quantity', sql.Int, quantity)
      .input('price', sql.Decimal(10, 2), price)
      .query(`
        INSERT INTO Inventory (name, category, quantity, price) 
        VALUES (@name, @category, @quantity, @price)
      `);
    
    res.json({ success: true, message: 'Producto agregado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ PUT - Actualizar producto
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, price } = req.body;
    
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.VarChar, name)
      .input('category', sql.VarChar, category)
      .input('quantity', sql.Int, quantity)
      .input('price', sql.Decimal(10, 2), price)
      .query(`
        UPDATE Inventory 
        SET name = @name, category = @category, quantity = @quantity, price = @price
        WHERE id = @id
      `);
    
    res.json({ success: true, message: 'Producto actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ DELETE - Eliminar producto
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Inventory WHERE id = @id');
    
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  await initializeDatabase();
});