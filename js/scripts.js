// ================================================
// SISTEMA DE PUNTAJE Y MEDALLAS - 2° BÁSICO
// Almacena progreso en localStorage
// ================================================

const CLAVES = {
    progreso: 'progreso_historia',
    puntajes: 'puntajes_historia'
};

// Estado inicial de las 14 clases
function obtenerEstadoInicial() {
    const estado = {};
    for (let i = 1; i <= 14; i++) {
        estado[`C${i}`] = 'pendiente'; // pendiente, completado-oro, completado-plata, etc.
    }
    return estado;
}

// Obtener progreso guardado o inicial
function obtenerProgreso() {
    const guardado = localStorage.getItem(CLAVES.progreso);
    if (guardado) {
        try {
            return JSON.parse(guardado);
        } catch (e) {
            return obtenerEstadoInicial();
        }
    }
    return obtenerEstadoInicial();
}

// Guardar progreso
function guardarProgreso(progreso) {
    localStorage.setItem(CLAVES.progreso, JSON.stringify(progreso));
}

// Obtener puntajes guardados
function obtenerPuntajes() {
    const guardado = localStorage.getItem(CLAVES.puntajes);
    if (guardado) {
        try {
            return JSON.parse(guardado);
        } catch (e) {
            return {};
        }
    }
    return {};
}

// Guardar puntaje de un ejercicio
function guardarPuntaje(claseId, puntaje, medalla) {
    const puntajes = obtenerPuntajes();
    puntajes[claseId] = { puntaje, medalla };
    localStorage.setItem(CLAVES.puntajes, JSON.stringify(puntajes));
}

// Actualizar los estados visuales en el index de Historia
function actualizarEstadosHistoria() {
    const progreso = obtenerProgreso();
    const puntajes = obtenerPuntajes();

    for (let i = 1; i <= 14; i++) {
        const claseId = `C${i}`;
        const estado = progreso[claseId] || 'pendiente';
        const elemento = document.getElementById(`estado-${claseId}`);
        if (elemento) {
            // Mostrar ícono según estado
            if (estado === 'pendiente') {
                elemento.textContent = '📝';
                elemento.className = 'clase-estado';
            } else if (estado === 'completado-oro') {
                elemento.textContent = '🥇';
                elemento.className = 'clase-estado completado-oro';
            } else if (estado === 'completado-plata') {
                elemento.textContent = '🥈';
                elemento.className = 'clase-estado completado-plata';
            } else if (estado === 'completado-bronce') {
                elemento.textContent = '🥉';
                elemento.className = 'clase-estado completado-bronce';
            } else {
                elemento.textContent = '⭐';
                elemento.className = 'clase-estado completado-estrella';
            }
        }
    }

    // Actualizar contador de progreso
    const completadas = Object.values(progreso).filter(
        v => v !== 'pendiente'
    ).length;
    const total = 14;
    const progresoTexto = document.getElementById('progreso-texto');
    if (progresoTexto) {
        progresoTexto.textContent = `${completadas} / ${total}`;
    }
}

// Reiniciar progreso (con confirmación)
function reiniciarProgresoHistoria() {
    if (confirm('¿Seguro que quieres reiniciar todo tu progreso en Historia?')) {
        const inicial = obtenerEstadoInicial();
        guardarProgreso(inicial);
        localStorage.removeItem(CLAVES.puntajes);
        actualizarEstadosHistoria();
        // Recargar la página para refrescar todo
        location.reload();
    }
}

// ================================================
// FUNCIONES PARA EJERCICIOS (usar en cada E*.html)
// ================================================

// Determinar medalla según puntaje (máximo 20)
function calcularMedalla(puntaje) {
    if (puntaje >= 18) return { nombre: '🥇 Oro', clase: 'medalla-oro' };
    if (puntaje >= 15) return { nombre: '🥈 Plata', clase: 'medalla-plata' };
    if (puntaje >= 12) return { nombre: '🥉 Bronce', clase: 'medalla-bronce' };
    return { nombre: '⭐ Estrella', clase: 'medalla-estrella' };
}

// Mostrar resultado al finalizar un ejercicio
function mostrarResultado(claseId, puntaje, totalPreguntas) {
    const medalla = calcularMedalla(puntaje);

    // Guardar en localStorage
    guardarPuntaje(claseId, puntaje, medalla.nombre);

    // Actualizar progreso (marcar clase como completada)
    const progreso = obtenerProgreso();
    let estadoClase = 'completado-estrella';
    if (puntaje >= 18) estadoClase = 'completado-oro';
    else if (puntaje >= 15) estadoClase = 'completado-plata';
    else if (puntaje >= 12) estadoClase = 'completado-bronce';
    progreso[claseId] = estadoClase;
    guardarProgreso(progreso);

    // Mostrar medalla en pantalla
    const container = document.getElementById('medalla-resultado');
    if (container) {
        container.className = `medalla-container visible ${medalla.clase}`;
        container.innerHTML = `
            <div class="medalla-icono">${medalla.nombre.split(' ')[0]}</div>
            <div class="medalla-nombre">${medalla.nombre}</div>
            <div class="medalla-puntaje">⭐ ${puntaje} de ${totalPreguntas} puntos</div>
            <p style="margin-top:10px;font-size:0.95rem;color:#666;">
                ${puntaje >= 18 ? '¡Excelente trabajo! 🌟' :
                  puntaje >= 15 ? '¡Muy bien! 👍' :
                  puntaje >= 12 ? '¡Buen trabajo! 💪' :
                  '¡Sigue practicando! 📖'}
            </p>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <a href="../ejercicios/E${claseId.replace('C','')}.html" class="btn-navegacion">🔄 Reintentar</a>
                <a href="../index.html" class="btn-navegacion principal">🏠 Inicio</a>
            </div>
        `;
    }
}

// ================================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Si estamos en el index de Historia, actualizar estados
    if (window.location.pathname.includes('historia/index.html')) {
        actualizarEstadosHistoria();
    }

    // Si estamos en un ejercicio, buscar el botón de reinicio de progreso
    const btnReiniciar = document.querySelector('.btn-reiniciar');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', reiniciarProgresoHistoria);
    }
});