const sql = require('mssql');

const dbConfig = {
  server: 'DESKTOP-QSLG77P\\SQLEXPRESS',  // ← Agregar doble barra invertida
  database: 'BodegaDB',
  user: 'bodega_user',
  password: 'Bodega123!',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 15000
  }
};

let poolPromise;

const getConnection = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log('✅ Conectado a SQL Server con Autenticación SQL');
        console.log('📊 Servidor: DESKTOP-QSLG77P\\SQLEXPRESS');  // ← Corregir mensaje
        console.log('👤 Usuario: bodega_user');
        console.log('🗄️ Base de datos: BodegaDB');
        return pool;
      })
      .catch(err => {
        console.log('❌ Error de conexión:', err.message);
        console.log('\n🔧 VERIFICAR EN PC ANTIGUA:');
        console.log('   1. ¿El usuario bodega_user existe en esta PC?');
        console.log('   2. ¿La base de datos BodegaDB existe en esta PC?');
        console.log('   3. ¿SQL Server Express está ejecutándose?');
        console.log('   4. ¿La autenticación mixta está habilitada?');
        throw err;
      });
  }
  return poolPromise;
};

module.exports = { getConnection, sql };