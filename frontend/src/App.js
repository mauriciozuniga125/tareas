import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [actividades, setActividades] = useState([]);
  const [nombre, setNombre] = useState('');
  const [dia, setDia] = useState('');
  const [fecha, setFecha] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todas');
  const [sort, setSort] = useState('fecha-asc');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [toasts, setToasts] = useState([]);
  const [undoInfo, setUndoInfo] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/actividades').then((res) => {
      setActividades(res.data.data);
    });
  }, []);

  const showToast = (text, type = 'success', actionLabel, action) => {
    const id = Date.now();
    const t = { id, text, type, actionLabel, action };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  };

  const agregarActividad = () => {
    if (!nombre.trim() || !dia || !fecha) {
      showToast('Completa nombre, hora y fecha', 'error');
      return;
    }
    axios
      .post('http://localhost:3000/actividades', { nombre, dia, fecha })
      .then(() => {
        setNombre('');
        setDia('');
        setFecha('');
        axios.get('http://localhost:3000/actividades').then((res) => {
          setActividades(res.data.data);
          showToast('Actividad agregada');
        });
      });
  };

  const eliminarActividad = (actividad) => {
    const ok = window.confirm('¿Eliminar esta actividad?');
    if (!ok) return;
    axios.delete(`http://localhost:3000/actividades/${actividad.id}`).then(() => {
      axios.get('http://localhost:3000/actividades').then((res) => {
        setActividades(res.data.data);
        const action = () => {
          axios
            .post('http://localhost:3000/actividades', {
              nombre: actividad.nombre,
              dia: actividad.dia,
              fecha: actividad.fecha,
              terminado: actividad.terminado || null,
            })
            .then(() => {
              axios.get('http://localhost:3000/actividades').then((r2) => {
                setActividades(r2.data.data);
                showToast('Eliminación deshecha');
              });
            });
        };
        setUndoInfo({ activity: actividad });
        showToast('Actividad eliminada', 'success', 'Deshacer', action);
      });
    });
  };

  const terminarActividad = (id) => {
    axios.put(`http://localhost:3000/actividades/${id}/terminar`).then(() => {
      axios.get('http://localhost:3000/actividades').then((res) => {
        setActividades(res.data.data);
        showToast('Marcada como terminada');
      });
    });
  };

  const exportCSV = (rows) => {
    const header = ['nombre', 'hora', 'fecha', 'terminado'];
    const lines = [header.join(',')].concat(
      rows.map((a) => [a.nombre, a.dia, a.fecha, a.terminado || ''].map((v) => String(v).replace(/,/g, ' ')).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'actividades.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const lines = String(text).trim().split(/\r?\n/);
      const cols = lines.shift().split(',');
      const idx = {
        nombre: cols.indexOf('nombre'),
        hora: cols.indexOf('hora'),
        fecha: cols.indexOf('fecha'),
        terminado: cols.indexOf('terminado'),
      };
      const tasks = lines.map((ln) => {
        const parts = ln.split(',');
        const payload = {
          nombre: parts[idx.nombre] || '',
          dia: parts[idx.hora] || '',
          fecha: parts[idx.fecha] || '',
          terminado: parts[idx.terminado] || null,
        };
        return axios.post('http://localhost:3000/actividades', payload);
      });
      Promise.all(tasks).then(() => {
        axios.get('http://localhost:3000/actividades').then((res) => {
          setActividades(res.data.data);
          showToast('Importación completada');
        });
      });
    };
    reader.readAsText(file);
  };

  const filtered = actividades
    .filter((a) => (search ? a.nombre.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((a) => {
      if (estado === 'terminadas') return !!a.terminado;
      if (estado === 'pendientes') return !a.terminado;
      return true;
    })
    .filter((a) => (fechaFiltro ? a.fecha === fechaFiltro : true))
    .sort((a, b) => {
      const [key, ord] = sort.split('-');
      const va = key === 'fecha' ? a.fecha : a.nombre.toLowerCase();
      const vb = key === 'fecha' ? b.fecha : b.nombre.toLowerCase();
      return ord === 'asc' ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
    });

  return (
    <div className="App">
      <div className="sidebar">
        <h2>Orange 612</h2>
        <div className="lista">
          {filtered.map((actividad) => (
            <div key={actividad.id} className="actividad">
              <div className="actividad-header">
                <h3>{actividad.nombre}</h3>
                <div className="acciones">
                  <button className="btn btn-primary" onClick={() => terminarActividad(actividad.id)}>Hora acabada</button>
                  <button className="btn btn-danger" onClick={() => eliminarActividad(actividad)}>Eliminar</button>
                </div>
              </div>
              <div className="actividad-meta">
                <span>Hora: {actividad.dia}</span>
                <span>Fecha: {actividad.fecha}</span>
                {actividad.terminado && <span className="badge">Terminado: {actividad.terminado}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">
        <h1>Orange 612</h1>
        <div className="toolbar">
          <div className="filters">
            <input type="text" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="terminadas">Terminadas</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="fecha-asc">Fecha asc</option>
              <option value="fecha-desc">Fecha desc</option>
              <option value="nombre-asc">Nombre asc</option>
              <option value="nombre-desc">Nombre desc</option>
            </select>
            <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={() => exportCSV(filtered)}>Exportar CSV</button>
            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
              Importar CSV
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && importCSV(e.target.files[0])} />
            </label>
          </div>
        </div>
        <div className="form">
          <input
            type="text"
            placeholder="Nombre de la actividad"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="time"
            placeholder="Hora"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
          />
          <input
            type="date"
            placeholder="Fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <div className="actions">
            <button className="btn btn-primary" onClick={agregarActividad}>Agregar actividad</button>
          </div>
        </div>
      </div>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.text}</span>
            {t.actionLabel && <button className="btn btn-outline" onClick={t.action}>{t.actionLabel}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
