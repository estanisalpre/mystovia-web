import mysql from 'mysql2/promise';

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: '181.12.68.6',
      user: 'webuser',
      password: 'TibiaWeb123!',
      database: 'otserver',
      port: 3306,
    });

    console.log('✅ Conexión exitosa a MySQL remoto!');
    const [rows] = await connection.query('SHOW DATABASES;');
    console.log('Bases de datos:', rows);
    await connection.end();
  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Error de conexión:', err.message);
    } else {
      console.error('❌ Error desconocido:', err);
    }
  }
})();