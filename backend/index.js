const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// Conectar a la base de datos
const db = new sqlite3.Database('./db/actividades.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos de actividades.');
});

// Crear la tabla de actividades si no existe
db.run('CREATE TABLE IF NOT EXISTS actividades (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, dia TEXT NOT NULL, fecha TEXT NOT NULL)');
db.all('PRAGMA table_info(actividades)', [], (err, rows) => {
  if (!err && rows && !rows.find((r) => r.name === 'terminado')) {
    db.run('ALTER TABLE actividades ADD COLUMN terminado TEXT');
  }
});

// Obtener todas las actividades
app.get('/actividades', (req, res) => {
  db.all('SELECT * FROM actividades', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Crear una nueva actividad
app.post('/actividades', (req, res) => {
  const { nombre, dia, fecha, terminado } = req.body;
  db.run('INSERT INTO actividades (nombre, dia, fecha, terminado) VALUES (?, ?, ?, ?)', [nombre, dia, fecha, terminado || null], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Actualizar una actividad
app.put('/actividades/:id', (req, res) => {
  const { nombre, dia, fecha } = req.body;
  db.run('UPDATE actividades SET nombre = ?, dia = ?, fecha = ? WHERE id = ?', [nombre, dia, fecha, req.params.id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Eliminar una actividad
app.delete('/actividades/:id', (req, res) => {
  db.run('DELETE FROM actividades WHERE id = ?', req.params.id, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

app.put('/actividades/:id/terminar', (req, res) => {
  const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  db.run('UPDATE actividades SET terminado = ? WHERE id = ?', [hora, req.params.id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes, terminado: hora });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
app.get('/test', (req, res) => {
  res.send('OK');
});
app.use(express.static(path.join(__dirname, '../frontend/build'), { index: 'index.html', fallthrough: true }));
app.use((req, res, next) => {
  const url = req.url || '/';
  if (req.method === 'GET' && !url.startsWith('/actividades')) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    return;
  }
  next();
});

app.listen(port, () => {
  console.log(`El servidor está escuchando en http://localhost:${port}`);
});
