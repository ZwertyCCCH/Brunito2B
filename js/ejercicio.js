// ============================================
// LÓGICA COMÚN PARA TODOS LOS EJERCICIOS
// Versión 5.2 - CORREGIDA: Inicialización correcta
// ============================================

let respuestasUsuario = [];
let preguntaActual = 0;
let puntaje = 0;
let ejercicioFinalizado = false;
let preguntasSeleccionadas = [];

// ============================================
// FUNCIÓN PARA SELECCIONAR 20 PREGUNTAS ALEATORIAS (SIN REPETICIÓN)
// ============================================
function seleccionarPreguntasAleatorias(poolPreguntas) {
    // Validar que poolPreguntas existe y es un array
    if (!poolPreguntas || !Array.isArray(poolPreguntas) || poolPreguntas.length === 0) {
        console.error('❌ Error: preguntasPool no está definido o está vacío');
        return [];
    }

    const copiaPreguntas = [...poolPreguntas];
    const seleccionadas = [];
    const cantidad = Math.min(20, copiaPreguntas.length);

    // Si hay menos o igual a 20, devolver todas mezcladas
    if (copiaPreguntas.length <= 20) {
        for (let i = copiaPreguntas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copiaPreguntas[i], copiaPreguntas[j]] = [copiaPreguntas[j], copiaPreguntas[i]];
        }
        return copiaPreguntas;
    }

    // Seleccionar 20 SIN REPETICIÓN
    for (let i = 0; i < cantidad; i++) {
        const indiceAleatorio = Math.floor(Math.random() * copiaPreguntas.length);
        seleccionadas.push(copiaPreguntas.splice(indiceAleatorio, 1)[0]);
    }

    return seleccionadas;
}

// ============================================
// REINICIAR SELECCIÓN DE PREGUNTAS
// ============================================
function reiniciarSeleccionPreguntas() {
    // ✅ Verificar que preguntasPool existe
    if (typeof preguntasPool !== 'undefined' && Array.isArray(preguntasPool)) {
        preguntasSeleccionadas = seleccionarPreguntasAleatorias(preguntasPool);
    } else {
        console.error('❌ Error: preguntasPool no está definido');
        preguntasSeleccionadas = [];
    }
}

// ============================================
// NAVEGACIÓN CON TECLADO (FLECHAS)
// ============================================
document.addEventListener('keydown', function(event) {
    if (ejercicioFinalizado) return;
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (preguntaActual > 0) {
            irAPregunta(preguntaActual - 1);
        }
    }
    else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (preguntaActual < preguntasSeleccionadas.length - 1) {
            irAPregunta(preguntaActual + 1);
        }
    }
});

// ============================================
// RENDERIZAR PREGUNTA
// ============================================
function renderizarPregunta(index) {
    // ✅ Verificar que hay preguntas seleccionadas
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) {
        console.error('❌ Error: No hay preguntas seleccionadas');
        const container = document.querySelector('.ejercicio-container');
        if (container) {
            const cuerpo = container.querySelector('.ejercicio-cuerpo');
            if (cuerpo) {
                cuerpo.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#e74c3c;">
                        <p style="font-size:1.2rem;font-weight:600;">⚠️ No hay preguntas disponibles</p>
                        <p style="color:#666;font-size:0.95rem;">Por favor, recarga la página o contacta al administrador.</p>
                    </div>
                `;
            }
        }
        return;
    }

    // ✅ Verificar que el índice es válido
    if (index < 0 || index >= preguntasSeleccionadas.length) {
        console.error(`❌ Error: Índice ${index} fuera de rango (0-${preguntasSeleccionadas.length - 1})`);
        return;
    }

    const p = preguntasSeleccionadas[index];
    const container = document.querySelector('.ejercicio-container');
    const titulo = container.querySelector('.ejercicio-titulo');
    const total = preguntasSeleccionadas.length;

    titulo.textContent = `📝 Pregunta ${index + 1} de ${total}`;

    let html = `
        <div style="display:flex;align-items:center;gap:15px;margin:10px 0;">
            <button class="flecha-nav" onclick="irAPregunta(${index - 1})" 
                    ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}
                    style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: 3px solid #4A90D9;
                        background: white;
                        color: #4A90D9;
                        font-size: 1.4rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        flex-shrink: 0;
                        ${index === 0 ? 'opacity:0.3;cursor:not-allowed;' : ''}
                    "
                    onmouseover="this.style.backgroundColor='#e8f0fe'"
                    onmouseout="this.style.backgroundColor='white'">
                ◀
            </button>

            <div style="flex:1;min-width:0;">
                <p style="font-size:1.05rem;font-weight:600;color:#2c3e50;margin-bottom:12px;">${p.texto}</p>
                <div class="opciones-grid" id="pregunta${index}" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    `;

    p.opciones.forEach((opcion, i) => {
        const seleccionada = respuestasUsuario[index] === i ? 'seleccionada' : '';
        html += `
            <button class="opcion-btn ${seleccionada}"
                    data-indice="${i}"
                    onclick="seleccionarOpcion(${index}, ${i})"
                    style="
                        background: ${respuestasUsuario[index] === i ? '#4A90D9' : 'white'};
                        color: ${respuestasUsuario[index] === i ? 'white' : '#2c3e50'};
                        border: 3px solid ${respuestasUsuario[index] === i ? '#4A90D9' : '#d0e0fc'};
                        border-radius: 15px;
                        padding: 14px 12px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-family: inherit;
                        text-align: center;
                    "
                    onmouseover="if(!this.classList.contains('seleccionada')){this.style.backgroundColor='#e8f0fe';this.style.borderColor='#4A90D9';}"
                    onmouseout="if(!this.classList.contains('seleccionada')){this.style.backgroundColor='white';this.style.borderColor='#d0e0fc';}">
                ${opcion}
            </button>
        `;
    });

    html += `
                </div>
            </div>

            <button class="flecha-nav" onclick="irAPregunta(${index + 1})" 
                    ${index === total - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}
                    style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: 3px solid #4A90D9;
                        background: white;
                        color: #4A90D9;
                        font-size: 1.4rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        flex-shrink: 0;
                        ${index === total - 1 ? 'opacity:0.3;cursor:not-allowed;' : ''}
                    "
                    onmouseover="this.style.backgroundColor='#e8f0fe'"
                    onmouseout="this.style.backgroundColor='white'">
                ▶
            </button>
        </div>
    `;

    const cuerpo = container.querySelector('.ejercicio-cuerpo');
    cuerpo.innerHTML = html;

    if (respuestasUsuario[index] !== null) {
        const botones = document.querySelectorAll(`#pregunta${index} .opcion-btn`);
        botones.forEach((btn, i) => {
            if (i === respuestasUsuario[index]) {
                btn.classList.add('seleccionada');
            }
        });
    }

    actualizarBarraProgreso();
}

// ============================================
// ACTUALIZAR BARRA DE PROGRESO
// ============================================
function actualizarBarraProgreso() {
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) return;

    const total = preguntasSeleccionadas.length;
    const respondidas = respuestasUsuario.filter(r => r !== null).length;
    const todasRespondidas = respondidas === total;
    const porcentaje = Math.round((respondidas / total) * 100);

    let progresoContainer = document.getElementById('progreso-container');
    if (!progresoContainer) {
        progresoContainer = document.createElement('div');
        progresoContainer.id = 'progreso-container';
        progresoContainer.style.cssText = `
            margin-top: 20px;
            padding: 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        `;
        const container = document.querySelector('.ejercicio-container');
        if (container) container.appendChild(progresoContainer);
    }

    const esCompleta = porcentaje === 100;
    let html = `
        <div class="barra-progreso-container">
            <div class="barra-progreso-llenado ${esCompleta ? 'completo' : ''}" style="width:${porcentaje}%;">
            </div>
        </div>
    `;

    if (esCompleta && !ejercicioFinalizado) {
        html += `
            <div style="text-align:center;font-size:0.9rem;color:#2ecc71;font-weight:600;animation:fadeSlide 0.5s ease;">
                ✅ ¡Todas las preguntas respondidas!
            </div>
        `;
    }

    if (todasRespondidas && !ejercicioFinalizado) {
        html += `
            <button class="btn-finalizar-pulso" onclick="finalizarEjercicio()" style="
                background: #2ecc71;
                color: white;
                border: none;
                padding: 12px 35px;
                border-radius: 30px;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.2s, transform 0.1s;
                display: inline-block;
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
            "
            onmouseover="this.style.backgroundColor='#27ae60'"
            onmouseout="this.style.backgroundColor='#2ecc71'"
            onmousedown="this.style.transform='scale(0.95)'"
            onmouseup="this.style.transform='scale(1)'">
                🏆 Finalizar
            </button>
        `;
    }

    progresoContainer.innerHTML = html;
}

// ============================================
// SELECCIONAR OPCIÓN
// ============================================
function seleccionarOpcion(pregIndex, opcIndex) {
    if (ejercicioFinalizado) return;
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) return;

    const botones = document.querySelectorAll(`#pregunta${pregIndex} .opcion-btn`);
    const botonClickeado = botones[opcIndex];

    if (botonClickeado) {
        const onda = document.createElement('span');
        onda.className = 'onda-efecto';
        botonClickeado.style.position = 'relative';
        botonClickeado.style.overflow = 'hidden';
        botonClickeado.appendChild(onda);

        setTimeout(() => {
            if (onda.parentNode) onda.remove();
        }, 700);

        botonClickeado.classList.remove('pop-seleccion');
        void botonClickeado.offsetWidth;
        botonClickeado.classList.add('pop-seleccion');

        setTimeout(() => {
            botonClickeado.classList.remove('pop-seleccion');
        }, 600);
    }

    respuestasUsuario[pregIndex] = opcIndex;
    renderizarPregunta(pregIndex);
}

// ============================================
// IR A OTRA PREGUNTA
// ============================================
function irAPregunta(index) {
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) return;
    if (index < 0 || index >= preguntasSeleccionadas.length) return;
    if (ejercicioFinalizado) return;

    const direccion = index > preguntaActual ? 'derecha' : 'izquierda';
    const container = document.querySelector('.ejercicio-container');
    const cuerpo = container.querySelector('.ejercicio-cuerpo');

    const padre = cuerpo.parentNode;
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: relative;
        min-height: 200px;
    `;

    const contenidoActual = cuerpo.innerHTML;
    tempContainer.innerHTML = `
        <div class="ejercicio-cuerpo-temp" style="
            animation: ${direccion === 'derecha' ? 'slideOutDerecha' : 'slideOutIzquierda'} 0.3s ease forwards;
        ">
            ${contenidoActual}
        </div>
    `;

    padre.replaceChild(tempContainer, cuerpo);

    setTimeout(() => {
        preguntaActual = index;

        const nuevoCuerpo = document.createElement('div');
        nuevoCuerpo.className = 'ejercicio-cuerpo';
        nuevoCuerpo.style.animation = `${direccion === 'derecha' ? 'slideInDerecha' : 'slideInIzquierda'} 0.35s ease forwards`;

        const p = preguntasSeleccionadas[index];
        const total = preguntasSeleccionadas.length;
        const titulo = container.querySelector('.ejercicio-titulo');
        titulo.textContent = `📝 Pregunta ${index + 1} de ${total}`;

        let html = `
            <div style="display:flex;align-items:center;gap:15px;margin:10px 0;">
                <button class="flecha-nav" onclick="irAPregunta(${index - 1})" 
                        ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}
                        style="
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            border: 3px solid #4A90D9;
                            background: white;
                            color: #4A90D9;
                            font-size: 1.4rem;
                            font-weight: 700;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            flex-shrink: 0;
                            ${index === 0 ? 'opacity:0.3;cursor:not-allowed;' : ''}
                        "
                        onmouseover="this.style.backgroundColor='#e8f0fe'"
                        onmouseout="this.style.backgroundColor='white'">
                    ◀
                </button>

                <div style="flex:1;min-width:0;">
                    <p style="font-size:1.05rem;font-weight:600;color:#2c3e50;margin-bottom:12px;">${p.texto}</p>
                    <div class="opciones-grid" id="pregunta${index}" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        `;

        p.opciones.forEach((opcion, i) => {
            const seleccionada = respuestasUsuario[index] === i ? 'seleccionada' : '';
            html += `
                <button class="opcion-btn ${seleccionada}"
                        data-indice="${i}"
                        onclick="seleccionarOpcion(${index}, ${i})"
                        style="
                            background: ${respuestasUsuario[index] === i ? '#4A90D9' : 'white'};
                            color: ${respuestasUsuario[index] === i ? 'white' : '#2c3e50'};
                            border: 3px solid ${respuestasUsuario[index] === i ? '#4A90D9' : '#d0e0fc'};
                            border-radius: 15px;
                            padding: 14px 12px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-family: inherit;
                            text-align: center;
                        "
                        onmouseover="if(!this.classList.contains('seleccionada')){this.style.backgroundColor='#e8f0fe';this.style.borderColor='#4A90D9';}"
                        onmouseout="if(!this.classList.contains('seleccionada')){this.style.backgroundColor='white';this.style.borderColor='#d0e0fc';}">
                    ${opcion}
                </button>
            `;
        });

        html += `
                    </div>
                </div>

                <button class="flecha-nav" onclick="irAPregunta(${index + 1})" 
                        ${index === total - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}
                        style="
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            border: 3px solid #4A90D9;
                            background: white;
                            color: #4A90D9;
                            font-size: 1.4rem;
                            font-weight: 700;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            flex-shrink: 0;
                            ${index === total - 1 ? 'opacity:0.3;cursor:not-allowed;' : ''}
                        "
                        onmouseover="this.style.backgroundColor='#e8f0fe'"
                        onmouseout="this.style.backgroundColor='white'">
                    ▶
                </button>
            </div>
        `;

        nuevoCuerpo.innerHTML = html;

        const contenedorTemp = container.querySelector('.ejercicio-cuerpo-temp');
        if (contenedorTemp) {
            contenedorTemp.parentNode.replaceChild(nuevoCuerpo, contenedorTemp);
        } else {
            const viejoCuerpo = container.querySelector('.ejercicio-cuerpo');
            if (viejoCuerpo) {
                viejoCuerpo.parentNode.replaceChild(nuevoCuerpo, viejoCuerpo);
            } else {
                container.appendChild(nuevoCuerpo);
            }
        }

        setTimeout(() => {
            nuevoCuerpo.style.animation = '';
        }, 400);

        actualizarBarraProgreso();

    }, 350);

    window.scrollTo(0, 0);
}

// ============================================
// FINALIZAR EJERCICIO
// ============================================
function finalizarEjercicio() {
    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) return;

    const total = preguntasSeleccionadas.length;
    const todasRespondidas = respuestasUsuario.every(r => r !== null);

    if (!todasRespondidas) {
        alert('📢 ¡Aún tienes preguntas sin responder! Revisa todas las preguntas antes de finalizar.');
        const index = respuestasUsuario.indexOf(null);
        if (index !== -1) irAPregunta(index);
        return;
    }

    ejercicioFinalizado = true;

    puntaje = 0;
    const resultados = [];
    preguntasSeleccionadas.forEach((p, i) => {
        const esCorrecta = respuestasUsuario[i] === p.correcta;
        if (esCorrecta) puntaje++;
        resultados.push({
            index: i,
            texto: p.texto,
            opciones: p.opciones,
            correcta: p.correcta,
            seleccionada: respuestasUsuario[i],
            esCorrecta: esCorrecta
        });
    });

    const container = document.querySelector('.ejercicio-container');
    if (container) container.style.display = 'none';

    const subtitulo = document.querySelector('.clase-subtitulo');
    if (subtitulo) subtitulo.style.display = 'none';

    const badge = document.querySelector('.contenido-clase > div:first-child');
    if (badge) badge.style.display = 'none';

    mostrarResumen(resultados);
    mostrarResultado(CLASE_ID, puntaje, total);
}

// ============================================
// MOSTRAR RESUMEN CON COLORES
// ============================================
function mostrarResumen(resultados) {
    const container = document.querySelector('.contenido-clase');

    const resumenExistente = document.getElementById('resumen-ejercicio');
    if (resumenExistente) resumenExistente.remove();

    const resumenDiv = document.createElement('div');
    resumenDiv.id = 'resumen-ejercicio';
    resumenDiv.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 25px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        border: 3px solid #e8f0fe;
    `;

    let html = `
        <h2 style="font-size:1.5rem;margin-bottom:15px;color:#2c3e50;">📊 Resumen de respuestas</h2>
        <p style="color:#666;margin-bottom:20px;">Revisa tus respuestas. Las correctas están en <span style="color:#2ecc71;font-weight:700;">verde</span> y las incorrectas en <span style="color:#e74c3c;font-weight:700;">rojo</span>.</p>
        <div style="display:grid;gap:12px;max-height:400px;overflow-y:auto;padding-right:10px;">
    `;

    resultados.forEach((r, i) => {
        const color = r.esCorrecta ? '#2ecc71' : '#e74c3c';
        const icono = r.esCorrecta ? '✅' : '❌';
        const respuestaTexto = r.opciones[r.seleccionada];
        const correctaTexto = r.opciones[r.correcta];
        const claseAnimacion = r.esCorrecta ? 'resumen-correcto' : 'resumen-incorrecto';

        html += `
            <div class="${claseAnimacion}" style="
                background: ${r.esCorrecta ? '#f0fff4' : '#fff5f5'};
                border-left: 6px solid ${color};
                padding: 12px 16px;
                border-radius: 12px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            ">
                <span style="font-size:1.2rem;font-weight:700;color:#555;min-width:30px;">${i + 1}.</span>
                <div style="flex:1;">
                    <div style="font-weight:600;color:#2c3e50;">${r.texto}</div>
                    <div style="margin-top:4px;font-size:0.95rem;">
                        <span style="color:${color};font-weight:600;">${icono} Tu respuesta: ${respuestaTexto}</span>
                        ${!r.esCorrecta ? ` <span style="color:#2ecc71;font-weight:600;">→ Correcta: ${correctaTexto}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    resumenDiv.innerHTML = html;

    const titulo = container.querySelector('.clase-titulo');
    if (titulo) {
        titulo.after(resumenDiv);
    } else {
        container.prepend(resumenDiv);
    }

    resumenDiv.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// MOSTRAR MEDALLA
// ============================================
function mostrarResultado(claseId, puntaje, total) {
    const medalla = calcularMedalla(puntaje);

    guardarPuntaje(claseId, puntaje, medalla.nombre);

    const progreso = obtenerProgreso();
    let estadoClase = 'completado-estrella';
    if (puntaje >= 18) estadoClase = 'completado-oro';
    else if (puntaje >= 15) estadoClase = 'completado-plata';
    else if (puntaje >= 12) estadoClase = 'completado-bronce';
    progreso[claseId] = estadoClase;
    guardarProgreso(progreso);

    const container = document.getElementById('medalla-resultado');
    if (container) {
        container.className = `medalla-container visible ${medalla.clase}`;
        container.innerHTML = `
            <div class="medalla-icono">${medalla.nombre.split(' ')[0]}</div>
            <div class="medalla-nombre">${medalla.nombre}</div>
            <div class="medalla-puntaje">⭐ ${puntaje} de ${total} puntos</div>
            <p style="margin-top:10px;font-size:0.95rem;color:#666;">
                ${puntaje >= 18 ? '¡Excelente trabajo! 🌟' :
                  puntaje >= 15 ? '¡Muy bien! 👍' :
                  puntaje >= 12 ? '¡Buen trabajo! 💪' :
                  '¡Sigue practicando! 📖'}
            </p>
            <div style="margin-top:15px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn-navegacion" onclick="reiniciarEjercicio()" 
                        style="background:#2c3e50;color:white;border:none;padding:12px 30px;border-radius:30px;font-size:1rem;font-weight:700;cursor:pointer;transition:background 0.2s;"
                        onmouseover="this.style.backgroundColor='#3d566e'"
                        onmouseout="this.style.backgroundColor='#2c3e50'">
                    🔄 Reintentar Ejercicio
                </button>
            </div>
        `;
    }
}

// ============================================
// REINICIAR EJERCICIO (CON NUEVA SELECCIÓN ALEATORIA)
// ============================================
function reiniciarEjercicio() {
    // ✅ Seleccionar NUEVAS 20 preguntas al azar (SIN REPETICIÓN)
    reiniciarSeleccionPreguntas();

    if (!preguntasSeleccionadas || preguntasSeleccionadas.length === 0) {
        alert('❌ No hay preguntas disponibles. Por favor, recarga la página.');
        return;
    }

    respuestasUsuario = new Array(preguntasSeleccionadas.length).fill(null);
    preguntaActual = 0;
    puntaje = 0;
    ejercicioFinalizado = false;

    const resumen = document.getElementById('resumen-ejercicio');
    if (resumen) resumen.remove();

    const medalla = document.getElementById('medalla-resultado');
    if (medalla) {
        medalla.className = 'medalla-container';
        medalla.innerHTML = '';
    }

    const container = document.querySelector('.ejercicio-container');
    if (container) container.style.display = 'block';

    const subtitulo = document.querySelector('.clase-subtitulo');
    if (subtitulo) subtitulo.style.display = 'block';

    const badge = document.querySelector('.contenido-clase > div:first-child');
    if (badge) badge.style.display = 'flex';

    const progresoContainer = document.getElementById('progreso-container');
    if (progresoContainer) progresoContainer.remove();

    renderizarPregunta(0);
    window.scrollTo(0, 0);
}

// ============================================
// INICIALIZAR - EJECUTAR CUANDO EL DOM ESTÉ LISTO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // ✅ Verificar que preguntasPool existe
    if (typeof preguntasPool === 'undefined' || !Array.isArray(preguntasPool) || preguntasPool.length === 0) {
        console.error('❌ Error: preguntasPool no está definido o está vacío');
        const container = document.querySelector('.ejercicio-container');
        if (container) {
            const cuerpo = container.querySelector('.ejercicio-cuerpo');
            if (cuerpo) {
                cuerpo.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#e74c3c;">
                        <p style="font-size:1.2rem;font-weight:600;">⚠️ Error: No se encontraron preguntas</p>
                        <p style="color:#666;font-size:0.95rem;">Por favor, contacta al administrador del sitio.</p>
                    </div>
                `;
            }
        }
        return;
    }

    console.log(`✅ Cargando ejercicio con ${preguntasPool.length} preguntas en el pool`);

    // ✅ Seleccionar 20 preguntas al azar
    preguntasSeleccionadas = seleccionarPreguntasAleatorias(preguntasPool);
    console.log(`✅ Seleccionadas ${preguntasSeleccionadas.length} preguntas para el ejercicio`);

    respuestasUsuario = new Array(preguntasSeleccionadas.length).fill(null);
    puntaje = 0;
    ejercicioFinalizado = false;

    if (preguntasSeleccionadas.length > 0) {
        renderizarPregunta(0);
    } else {
        console.error('❌ Error: No se seleccionaron preguntas');
        const container = document.querySelector('.ejercicio-container');
        if (container) {
            const cuerpo = container.querySelector('.ejercicio-cuerpo');
            if (cuerpo) {
                cuerpo.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#e74c3c;">
                        <p style="font-size:1.2rem;font-weight:600;">⚠️ No hay preguntas disponibles</p>
                        <p style="color:#666;font-size:0.95rem;">Por favor, recarga la página.</p>
                    </div>
                `;
            }
        }
    }
});