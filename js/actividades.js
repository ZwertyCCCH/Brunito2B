// ============================================
// ACTIVIDADES.JS - Lógica de actividades interactivas
// Versión completa con todas las correcciones
// ============================================

// ============================================
// 1a. DRAG & DROP - SIN ORDEN (cualquier orden) - CORREGIDO
// ============================================
function iniciarDragDrop(containerId, datos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { opciones, espacios, texto } = datos;
    let respuestas = new Array(espacios.length).fill(null);
    let espaciosCompletados = 0;

    // Construir HTML
    let html = `<div class="dragdrop-texto">`;

    // Mostrar texto con espacios
    const partes = texto.split('______');
    partes.forEach((parte, i) => {
        html += parte;
        if (i < espacios.length) {
            const espacio = espacios[i];
            const respondido = respuestas[i] !== null;
            html += `
                <span class="dragdrop-espacio ${respondido ? 'completado' : ''}" 
                      id="espacio-${i}" 
                      data-pista="${espacio.pista || ''}"
                      data-indice="${i}"
                      data-aceptada="${respondido ? 'true' : 'false'}">
                    ${respondido ? respuestas[i] : '______'}
                </span>
            `;
        }
    });
    html += `</div>`;

    // Mostrar opciones (mezcladas)
    html += `<div class="dragdrop-opciones" id="dragdrop-opciones-${containerId}">`;
    const opcionesMezcladas = [...opciones];
    for (let i = opcionesMezcladas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opcionesMezcladas[i], opcionesMezcladas[j]] = [opcionesMezcladas[j], opcionesMezcladas[i]];
    }
    opcionesMezcladas.forEach((opcion) => {
        const usada = respuestas.includes(opcion);
        html += `
            <div class="dragdrop-opcion ${usada ? 'usada' : ''}" 
                 data-palabra="${opcion}"
                 draggable="${!usada}"
                 style="${usada ? 'opacity:0.4;pointer-events:none;' : ''}">
                ${opcion}
            </div>
        `;
    });
    html += `</div>`;

    // Feedback
    html += `<div id="dragdrop-feedback-${containerId}" class="dragdrop-feedback"></div>`;

    container.innerHTML = html;

    // ============================================
    // FEEDBACK COMPARTIDO
    // ============================================
    function mostrarFeedback(mensaje, esCorrecto, persistente) {
        const feedback = document.getElementById(`dragdrop-feedback-${containerId}`);
        if (!feedback) return;
        feedback.innerHTML = `<div class="feedback-${esCorrecto ? 'correcto' : 'incorrecto'}">${mensaje}</div>`;
        if (!persistente) {
            setTimeout(() => { feedback.innerHTML = ''; }, 2000);
        }
    }
let palabrasPendientes = espacios.map(e => e.palabraCorrecta);
    // ============================================
    // LÓGICA DE COLOCACIÓN (compartida por mouse y touch)
    // ============================================
    function intentarColocar(espacio, palabra, opcionElement) {
        if (!espacio || espacio.dataset.aceptada === 'true') return;

        if (!opcionElement || opcionElement.classList.contains('usada')) {
            mostrarFeedback(`❌ La palabra "${palabra}" ya está usada.`, false);
            return;
        }

        const esCorrecta = palabrasPendientes.includes(palabra);

        if (esCorrecta) {
            // Correcto: colocar la palabra
            espacio.textContent = palabra;
            espacio.dataset.aceptada = 'true';
            espacio.dataset.respuesta = palabra;
            espacio.classList.add('completado', 'correcto');
            espacio.style.borderColor = '#2ecc71';
            espacio.style.backgroundColor = '#e8f5e9';
            espacio.style.color = '#1a7a3a';

            opcionElement.classList.add('usada');
            opcionElement.style.opacity = '0.4';
            opcionElement.style.pointerEvents = 'none';
            opcionElement.draggable = false;

            // Sacarla de las pendientes para que no se pueda repetir en otro espacio
            palabrasPendientes = palabrasPendientes.filter(p => p !== palabra);

            espaciosCompletados++;
            mostrarFeedback(`✅ ¡Correcto! Has colocado "${palabra}" en el lugar correcto.`, true);

            const totalEspacios = container.querySelectorAll('.dragdrop-espacio').length;
            if (espaciosCompletados === totalEspacios) {
                mostrarFeedback('🎉 ¡Excelente! Has completado todas las respuestas correctamente.', true, true);
            }
        } else {
            // Incorrecto: mostrar pista
            espacio.style.borderColor = '#e74c3c';
            espacio.style.backgroundColor = '#fadbd8';
            mostrarFeedback(`❌ "${palabra}" no es la palabra correcta para este espacio. ${pista ? 'Pista: ' + pista : ''}`, false);

            setTimeout(() => {
                espacio.style.borderColor = '#d0e0fc';
                espacio.style.backgroundColor = 'white';
            }, 2000);
        }
    }

    // ============================================
    // EVENTOS DE MOUSE (Drag & Drop nativo, escritorio)
    // ============================================
    container.querySelectorAll('.dragdrop-opcion').forEach(opcion => {
        opcion.addEventListener('dragstart', function(e) {
            if (this.classList.contains('usada')) return;
            e.dataTransfer.setData('text/plain', this.dataset.palabra);
            this.style.opacity = '0.5';
        });
        opcion.addEventListener('dragend', function() {
            this.style.opacity = this.classList.contains('usada') ? '0.4' : '1';
        });
    });

    container.querySelectorAll('.dragdrop-espacio').forEach(espacio => {
        espacio.addEventListener('dragover', function(e) {
            if (this.dataset.aceptada === 'true') return;
            e.preventDefault();
            this.style.borderColor = '#4A90D9';
        });
        espacio.addEventListener('dragleave', function() {
            if (this.dataset.aceptada === 'true') return;
            this.style.borderColor = '#d0e0fc';
        });
        espacio.addEventListener('drop', function(e) {
            e.preventDefault();
            if (this.dataset.aceptada === 'true') return;
            this.style.borderColor = '#d0e0fc';

            const palabra = e.dataTransfer.getData('text/plain');
            const opcionElement = container.querySelector(`.dragdrop-opcion[data-palabra="${palabra}"]`);
            intentarColocar(this, palabra, opcionElement);
        });
    });

    // ============================================
    // EVENTOS TÁCTILES (tablets y celulares)
    // El drag & drop nativo (dragstart/dragover/drop) NO se dispara
    // en pantallas táctiles, así que se implementa manualmente.
    // ============================================
    let elementoArrastrado = null;
    let clonVisual = null;

    function limpiarResaltados() {
        container.querySelectorAll('.dragdrop-espacio').forEach(esp => {
            if (esp.dataset.aceptada !== 'true') esp.style.borderColor = '#d0e0fc';
        });
    }

    container.querySelectorAll('.dragdrop-opcion').forEach(opcion => {
        opcion.addEventListener('touchstart', function(e) {
            if (this.classList.contains('usada')) return;
            elementoArrastrado = this;

            const rect = this.getBoundingClientRect();
            clonVisual = this.cloneNode(true);
            clonVisual.style.position = 'fixed';
            clonVisual.style.left = rect.left + 'px';
            clonVisual.style.top = rect.top + 'px';
            clonVisual.style.width = rect.width + 'px';
            clonVisual.style.margin = '0';
            clonVisual.style.pointerEvents = 'none';
            clonVisual.style.zIndex = '1000';
            clonVisual.style.opacity = '0.9';
            clonVisual.style.transform = 'scale(1.05)';
            document.body.appendChild(clonVisual);

            this.style.opacity = '0.3';
        }, { passive: true });

        opcion.addEventListener('touchmove', function(e) {
            if (!elementoArrastrado || !clonVisual) return;
            e.preventDefault(); // evita que la página haga scroll mientras se arrastra

            const touch = e.touches[0];
            clonVisual.style.left = (touch.clientX - clonVisual.offsetWidth / 2) + 'px';
            clonVisual.style.top = (touch.clientY - clonVisual.offsetHeight / 2) + 'px';

            limpiarResaltados();
            const elementoDebajo = document.elementFromPoint(touch.clientX, touch.clientY);
            const espacio = elementoDebajo ? elementoDebajo.closest('.dragdrop-espacio') : null;
            if (espacio && espacio.dataset.aceptada !== 'true') {
                espacio.style.borderColor = '#4A90D9';
            }
        }, { passive: false });

        opcion.addEventListener('touchend', function(e) {
            if (!elementoArrastrado) return;

            const touch = e.changedTouches[0];
            const elementoDebajo = document.elementFromPoint(touch.clientX, touch.clientY);
            const espacio = elementoDebajo ? elementoDebajo.closest('.dragdrop-espacio') : null;

            if (clonVisual) {
                clonVisual.remove();
                clonVisual = null;
            }
            limpiarResaltados();

            const opcionArrastrada = elementoArrastrado;
            elementoArrastrado = null;

            opcionArrastrada.style.opacity = opcionArrastrada.classList.contains('usada') ? '0.4' : '1';

            if (espacio) {
                intentarColocar(espacio, opcionArrastrada.dataset.palabra, opcionArrastrada);
            }
        });

        opcion.addEventListener('touchcancel', function() {
            if (clonVisual) {
                clonVisual.remove();
                clonVisual = null;
            }
            limpiarResaltados();
            if (elementoArrastrado) {
                elementoArrastrado.style.opacity = elementoArrastrado.classList.contains('usada') ? '0.4' : '1';
            }
            elementoArrastrado = null;
        });
    });

    container.dataset.espaciosCompletados = '0';
}

// ============================================
// 1b. DRAG & DROP - CON ORDEN (secuencia específica)
// ============================================
function iniciarDragDropOrden(containerId, datos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { opciones, espacios, texto } = datos;
    let respuestas = new Array(espacios.length).fill(null);
    let espaciosCompletados = 0;

    // Construir HTML
    let html = `<div class="dragdrop-texto">`;

    const partes = texto.split('______');
    partes.forEach((parte, i) => {
        html += parte;
        if (i < espacios.length) {
            const espacio = espacios[i];
            const respondido = respuestas[i] !== null;
            html += `
                <span class="dragdrop-espacio ${respondido ? 'completado' : ''}" 
                      id="espacio-${i}" 
                      data-palabra-correcta="${espacio.palabraCorrecta}"
                      data-pista="${espacio.pista || ''}"
                      data-indice="${i}"
                      data-orden="${i + 1}"
                      data-aceptada="${respondido ? 'true' : 'false'}">
                    ${respondido ? respuestas[i] : `______ (${i + 1})`}
                </span>
            `;
        }
    });
    html += `</div>`;

    // Mostrar opciones (mezcladas)
    html += `<div class="dragdrop-opciones" id="dragdrop-opciones-${containerId}">`;
    const opcionesMezcladas = [...opciones];
    for (let i = opcionesMezcladas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opcionesMezcladas[i], opcionesMezcladas[j]] = [opcionesMezcladas[j], opcionesMezcladas[i]];
    }
    opcionesMezcladas.forEach((opcion) => {
        const usada = respuestas.includes(opcion);
        html += `
            <div class="dragdrop-opcion ${usada ? 'usada' : ''}" 
                 data-palabra="${opcion}"
                 draggable="${!usada}"
                 style="${usada ? 'opacity:0.4;pointer-events:none;' : ''}">
                ${opcion}
            </div>
        `;
    });
    html += `</div>`;

    // Botón verificar para orden
    html += `
        <button class="btn-dragdrop-verificar" onclick="verificarDragDropOrden('${containerId}')">
            ✅ Verificar respuestas
        </button>
        <div id="dragdrop-feedback-${containerId}" class="dragdrop-feedback"></div>
    `;

    container.innerHTML = html;

    // Configurar eventos de arrastre
    const opcionesElementos = container.querySelectorAll('.dragdrop-opcion:not(.usada)');
    const espaciosElementos = container.querySelectorAll('.dragdrop-espacio:not(.completado)');

    opcionesElementos.forEach(opcion => {
        opcion.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.palabra);
            this.style.opacity = '0.5';
        });
        opcion.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
    });

    espaciosElementos.forEach(espacio => {
        espacio.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#4A90D9';
        });
        espacio.addEventListener('dragleave', function(e) {
            this.style.borderColor = '#d0e0fc';
        });
        espacio.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d0e0fc';

            if (this.dataset.aceptada === 'true') return;

            const palabra = e.dataTransfer.getData('text/plain');
            const indice = parseInt(this.dataset.indice);

            const opcionElement = container.querySelector(`.dragdrop-opcion[data-palabra="${palabra}"]`);
            if (!opcionElement || opcionElement.classList.contains('usada')) return;

            const palabraCorrecta = this.dataset.palabraCorrecta;

            if (palabra === palabraCorrecta) {
                this.textContent = palabra;
                this.dataset.aceptada = 'true';
                this.dataset.respuesta = palabra;
                this.classList.add('completado', 'correcto');
                this.style.borderColor = '#2ecc71';
                this.style.backgroundColor = '#e8f5e9';
                this.style.color = '#1a7a3a';

                opcionElement.classList.add('usada');
                opcionElement.style.opacity = '0.4';
                opcionElement.style.pointerEvents = 'none';
                opcionElement.draggable = false;

                espaciosCompletados++;

                const feedback = document.getElementById(`dragdrop-feedback-${containerId}`);
                if (feedback) {
                    feedback.innerHTML = `<div class="feedback-correcto">✅ ¡Correcto! "${palabra}" en el lugar ${indice + 1}.</div>`;
                    setTimeout(() => feedback.innerHTML = '', 2000);
                }

                const totalEspacios = document.querySelectorAll('.dragdrop-espacio').length;
                if (espaciosCompletados === totalEspacios) {
                    if (feedback) {
                        feedback.innerHTML = `<div class="feedback-correcto">🎉 ¡Excelente! Has completado todas las respuestas en el orden correcto.</div>`;
                    }
                }
            } else {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fadbd8';
                const pista = this.dataset.pista;
                const feedback = document.getElementById(`dragdrop-feedback-${containerId}`);
                if (feedback) {
                    feedback.innerHTML = `
                        <div class="feedback-incorrecto">❌ No es correcto para la posición ${indice + 1}. ${pista ? 'Pista: ' + pista : ''}</div>
                    `;
                }
                setTimeout(() => {
                    this.style.borderColor = '#d0e0fc';
                    this.style.backgroundColor = 'white';
                    if (feedback) feedback.innerHTML = '';
                }, 2000);

                opcionElement.style.opacity = '1';
                opcionElement.style.pointerEvents = 'auto';
                opcionElement.draggable = true;
            }
        });
    });

    container.dataset.espaciosCompletados = '0';
}

// ============================================
// VERIFICAR DRAG & DROP CON ORDEN
// ============================================
function verificarDragDropOrden(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const espacios = container.querySelectorAll('.dragdrop-espacio');
    let todasCorrectas = true;
    let completados = 0;
    const errores = [];

    espacios.forEach((espacio, i) => {
        const respuesta = espacio.dataset.respuesta;
        const correcta = espacio.dataset.palabraCorrecta;

        if (!respuesta) {
            todasCorrectas = false;
            espacio.classList.add('incompleto');
            errores.push(`Espacio ${i + 1}: vacío`);
            setTimeout(() => espacio.classList.remove('incompleto'), 1500);
            return;
        }

        if (respuesta === correcta) {
            espacio.classList.add('correcto');
            completados++;
        } else {
            todasCorrectas = false;
            espacio.classList.add('incorrecto');
            errores.push(`Espacio ${i + 1}: esperaba "${correcta}", tienes "${respuesta}"`);
            setTimeout(() => espacio.classList.remove('incorrecto'), 2000);
        }
    });

    const feedback = document.getElementById(`dragdrop-feedback-${containerId}`);
    if (feedback) {
        if (todasCorrectas && completados === espacios.length) {
            feedback.innerHTML = `
                <div class="feedback-correcto">🎉 ¡Excelente! Has completado todas las respuestas en el orden correcto.</div>
            `;
        } else {
            let mensaje = `📝 Tienes ${completados} de ${espacios.length} correctos. `;
            if (errores.length > 0) {
                mensaje += `<br>🔍 Revisa: ${errores.join('; ')}`;
            }
            feedback.innerHTML = `
                <div class="feedback-parcial">${mensaje}</div>
            `;
        }
    }
}

// ============================================
// 2. ORDENAR SECUENCIA
// ============================================
function iniciarOrdenar(containerId, elementos, ordenCorrecto) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const elementosMezclados = [...elementos];
    for (let i = elementosMezclados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elementosMezclados[i], elementosMezclados[j]] = [elementosMezclados[j], elementosMezclados[i]];
    }

    let html = `
        <div class="ordenar-container" id="ordenar-${containerId}">
            <p class="ordenar-instruccion">Arrastra los elementos al orden correcto.</p>
            <div class="ordenar-lista" id="ordenar-lista-${containerId}">
    `;

    elementosMezclados.forEach((el, i) => {
        html += `
            <div class="ordenar-item" draggable="true" data-id="${el.id}" data-index="${i}">
                <span class="ordenar-numero">${i + 1}</span>
                <span class="ordenar-texto">${el.texto}</span>
            </div>
        `;
    });

    html += `
            </div>
            <button class="btn-ordenar-verificar" onclick="verificarOrdenar('${containerId}', ${JSON.stringify(ordenCorrecto)})">
                ✅ Verificar orden
            </button>
            <div id="ordenar-feedback-${containerId}" class="ordenar-feedback"></div>
        </div>
    `;

    container.innerHTML = html;

    const items = container.querySelectorAll('.ordenar-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const parent = this.parentNode;
                const children = parent.querySelectorAll('.ordenar-item');
                const fromIndex = Array.from(children).indexOf(draggedItem);
                const toIndex = Array.from(children).indexOf(this);

                if (fromIndex < toIndex) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }

                const nuevosItems = parent.querySelectorAll('.ordenar-item');
                nuevosItems.forEach((item, i) => {
                    item.querySelector('.ordenar-numero').textContent = i + 1;
                    item.dataset.index = i;
                });
            }
        });
    });
}

// ============================================
// VERIFICAR ORDENAR
// ============================================
function verificarOrdenar(containerId, ordenCorrecto) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = container.querySelectorAll('.ordenar-item');
    const ordenActual = Array.from(items).map(item => item.dataset.id);
    const feedback = document.getElementById(`ordenar-feedback-${containerId}`);

    if (!feedback) return;

    const esCorrecto = ordenActual.every((id, i) => id === ordenCorrecto[i]);

    if (esCorrecto) {
        feedback.innerHTML = `
            <div class="feedback-correcto">🎉 ¡Excelente! Has ordenado todos los elementos correctamente.</div>
        `;
        items.forEach(item => item.classList.add('correcto'));
    } else {
        let mensaje = '❌ Algunos elementos están en el orden incorrecto. ';
        let posicionesCorrectas = 0;
        items.forEach((item, i) => {
            if (item.dataset.id === ordenCorrecto[i]) {
                item.classList.add('correcto');
                posicionesCorrectas++;
            } else {
                item.classList.remove('correcto');
                item.classList.add('incorrecto');
                setTimeout(() => item.classList.remove('incorrecto'), 1500);
            }
        });
        mensaje += `Tienes ${posicionesCorrectas} de ${ordenCorrecto.length} en la posición correcta.`;
        feedback.innerHTML = `
            <div class="feedback-parcial">${mensaje}</div>
        `;
    }
}

// ============================================
// 3. LÍNEA DE TIEMPO INTERACTIVA
// ============================================
function iniciarLineaTiempo(containerId, eventos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
        <div class="linea-tiempo-container">
            <div class="linea-tiempo-linea">
    `;

    eventos.forEach((evento, i) => {
        const esActivo = i === 0;
        html += `
            <div class="linea-tiempo-punto ${esActivo ? 'activo' : ''}" 
                 data-index="${i}" 
                 onclick="mostrarEventoLineaTiempo('${containerId}', ${i})">
                <span class="linea-tiempo-año">${evento.año}</span>
            </div>
        `;
        if (i < eventos.length - 1) {
            html += `<div class="linea-tiempo-conector"></div>`;
        }
    });

    html += `
            </div>
            <div class="linea-tiempo-detalle" id="linea-detalle-${containerId}">
    `;

    if (eventos.length > 0) {
        const primerEvento = eventos[0];
        html += `
            <div class="linea-tiempo-info">
                <h3>${primerEvento.titulo}</h3>
                <p>${primerEvento.descripcion}</p>
                ${primerEvento.imagen ? `<img src="${primerEvento.imagen}" alt="${primerEvento.titulo}">` : ''}
                <span class="linea-tiempo-fecha">📅 ${primerEvento.año}</span>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.dataset.eventos = JSON.stringify(eventos);
}

// ============================================
// MOSTRAR EVENTO EN LÍNEA DE TIEMPO
// ============================================
function mostrarEventoLineaTiempo(containerId, index) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const eventos = JSON.parse(container.dataset.eventos);
    if (!eventos || index < 0 || index >= eventos.length) return;

    const evento = eventos[index];

    const puntos = container.querySelectorAll('.linea-tiempo-punto');
    puntos.forEach((punto, i) => {
        punto.classList.toggle('activo', i === index);
    });

    const detalle = document.getElementById(`linea-detalle-${containerId}`);
    if (detalle) {
        detalle.innerHTML = `
            <div class="linea-tiempo-info">
                <h3>${evento.titulo}</h3>
                <p>${evento.descripcion}</p>
                ${evento.imagen ? `<img src="${evento.imagen}" alt="${evento.titulo}">` : ''}
                <span class="linea-tiempo-fecha">📅 ${evento.año}</span>
            </div>
        `;
    }
}

// ============================================
// 4. SOPA DE LETRAS INTERACTIVA - CORREGIDA
// ============================================
let seleccionSopa = [];
let sopaPalabrasEncontradas = [];

function iniciarSopaLetras(containerId, palabras, gridSize = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Ajustar grid según el tamaño de la pantalla
    const anchoPantalla = window.innerWidth;
    let size = gridSize;
    
    // En móviles, usar grid más pequeño
    if (anchoPantalla <= 400) {
        size = Math.min(gridSize, 6);
    } else if (anchoPantalla <= 600) {
        size = Math.min(gridSize, 8);
    }
    
    // Asegurar que size sea suficiente para las palabras
    const palabraMasLarga = Math.max(...palabras.map(p => p.length));
    size = Math.max(size, palabraMasLarga + 2);
    size = Math.min(size, 12);

    const grid = generarGridSopaLetras(palabras, size);

    seleccionSopa = [];
    sopaPalabrasEncontradas = [];

    let html = `
        <div class="sopa-letras-container">
            <p class="sopa-letras-instruccion">Encuentra las siguientes palabras en la sopa de letras:</p>
            <div class="sopa-letras-palabras" id="sopa-palabras-${containerId}">
    `;

    palabras.forEach(palabra => {
        html += `<span class="sopa-letras-palabra" data-palabra="${palabra}">${palabra}</span>`;
    });

    // No fijamos "max-width" en px desde JS: un estilo inline le gana en
    // especificidad a las media queries del CSS y por eso el grid nunca
    // se achicaba en el celular. El tope de ancho por tamaño de pantalla
    // queda 100% a cargo de estilo.css (.sopa-letras-grid).
    html += `
            </div>
            <div class="sopa-letras-grid" style="grid-template-columns: repeat(${size}, minmax(0, 1fr));" id="sopa-grid-${containerId}">
    `;

    grid.forEach((letra, i) => {
        const fila = Math.floor(i / size);
        const col = i % size;
        html += `
            <div class="sopa-letras-celda" data-fila="${fila}" data-col="${col}" 
                 onclick="seleccionarCeldaSopa('${containerId}', ${fila}, ${col})">
                ${letra}
            </div>
        `;
    });

    html += `
            </div>
            <div id="sopa-feedback-${containerId}" class="sopa-letras-feedback"></div>
        </div>
    `;

    container.innerHTML = html;

    container.dataset.palabras = JSON.stringify(palabras);
    container.dataset.grid = JSON.stringify(grid);
    container.dataset.size = size;
    container.dataset.seleccionadas = JSON.stringify([]);
}

// ============================================
// GENERAR GRID DE SOPA DE LETRAS
// ============================================
function generarGridSopaLetras(palabras, size) {
    const grid = Array(size * size).fill('');
    const direcciones = [
        [0, 1], [1, 0], [1, 1], [1, -1],
        [0, -1], [-1, 0], [-1, -1], [-1, 1]
    ];

    const palabrasOrdenadas = [...palabras].sort((a, b) => b.length - a.length);

    palabrasOrdenadas.forEach(palabra => {
        let colocada = false;
        let intentos = 0;
        const palabraUpper = palabra.toUpperCase();

        while (!colocada && intentos < 200) {
            intentos++;
            const fila = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            const dir = direcciones[Math.floor(Math.random() * direcciones.length)];

            let cabe = true;
            for (let i = 0; i < palabraUpper.length; i++) {
                const nf = fila + dir[0] * i;
                const nc = col + dir[1] * i;
                if (nf < 0 || nf >= size || nc < 0 || nc >= size) {
                    cabe = false;
                    break;
                }
                const index = nf * size + nc;
                if (grid[index] !== '' && grid[index] !== palabraUpper[i]) {
                    cabe = false;
                    break;
                }
            }

            if (cabe) {
                for (let i = 0; i < palabraUpper.length; i++) {
                    const nf = fila + dir[0] * i;
                    const nc = col + dir[1] * i;
                    const index = nf * size + nc;
                    grid[index] = palabraUpper[i];
                }
                colocada = true;
            }
        }
    });

    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === '') {
            grid[i] = letras[Math.floor(Math.random() * letras.length)];
        }
    }

    return grid;
}

// ============================================
// SELECCIONAR CELDA EN SOPA DE LETRAS
// ============================================
function seleccionarCeldaSopa(containerId, fila, col) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const grid = JSON.parse(container.dataset.grid);
    const size = parseInt(container.dataset.size);
    const index = fila * size + col;

    const celda = container.querySelector(`.sopa-letras-celda[data-fila="${fila}"][data-col="${col}"]`);
    if (!celda) return;

    if (celda.classList.contains('seleccionada')) {
        celda.classList.remove('seleccionada');
        seleccionSopa = seleccionSopa.filter(s => !(s.fila === fila && s.col === col));
        return;
    }

    if (seleccionSopa.length > 0) {
        const ultima = seleccionSopa[seleccionSopa.length - 1];
        const diffFila = Math.abs(fila - ultima.fila);
        const diffCol = Math.abs(col - ultima.col);
        if (diffFila > 1 || diffCol > 1 || (diffFila === 0 && diffCol === 0)) {
            seleccionSopa.forEach(s => {
                const c = container.querySelector(`.sopa-letras-celda[data-fila="${s.fila}"][data-col="${s.col}"]`);
                if (c) c.classList.remove('seleccionada');
            });
            seleccionSopa = [];
        }
    }

    celda.classList.add('seleccionada');
    seleccionSopa.push({ fila, col });

    const palabras = JSON.parse(container.dataset.palabras);
    const letrasSeleccionadas = seleccionSopa.map(s => grid[s.fila * size + s.col]);
    const palabraFormada = letrasSeleccionadas.join('');
    const palabraReversa = palabraFormada.split('').reverse().join('');

    let palabraEncontrada = null;
    for (const p of palabras) {
        const pUpper = p.toUpperCase();
        if (palabraFormada === pUpper || palabraReversa === pUpper) {
            palabraEncontrada = p;
            break;
        }
    }

    if (palabraEncontrada) {
        const palabraElement = container.querySelector(`.sopa-letras-palabra[data-palabra="${palabraEncontrada}"]`);
        if (palabraElement && !palabraElement.classList.contains('encontrada')) {
            palabraElement.classList.add('encontrada');
            sopaPalabrasEncontradas.push(palabraEncontrada);

            seleccionSopa.forEach(s => {
                const c = container.querySelector(`.sopa-letras-celda[data-fila="${s.fila}"][data-col="${s.col}"]`);
                if (c) {
                    c.classList.remove('seleccionada');
                    c.classList.add('encontrada');
                    const usos = parseInt(c.dataset.usos || '0', 10) + 1;
                    c.dataset.usos = usos;
                }
            });

            seleccionSopa = [];

            const feedback = document.getElementById(`sopa-feedback-${containerId}`);
            if (feedback) {
                feedback.innerHTML = `<div class="feedback-correcto">🎉 ¡Encontraste "${palabraEncontrada}"!</div>`;
                setTimeout(() => feedback.innerHTML = '', 2000);
            }

            const palabrasRestantes = container.querySelectorAll('.sopa-letras-palabra:not(.encontrada)');
            if (palabrasRestantes.length === 0) {
                if (feedback) {
                    feedback.innerHTML = `<div class="feedback-correcto">🎉 ¡Excelente! Has encontrado todas las palabras.</div>`;
                }
            }
        } else {
            seleccionSopa.forEach(s => {
                const c = container.querySelector(`.sopa-letras-celda[data-fila="${s.fila}"][data-col="${s.col}"]`);
                if (c) c.classList.remove('seleccionada');
            });
            seleccionSopa = [];
            const feedback = document.getElementById(`sopa-feedback-${containerId}`);
            if (feedback) {
                feedback.innerHTML = `<div class="feedback-incorrecto">⚠️ La palabra "${palabraEncontrada}" ya la encontraste.</div>`;
                setTimeout(() => feedback.innerHTML = '', 2000);
            }
        }
    }
}

// ============================================
// 5. SOPA DE LETRAS - REINICIAR (función auxiliar)
// ============================================
function reiniciarSopaLetras(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const palabras = JSON.parse(container.dataset.palabras);
    const size = parseInt(container.dataset.size);

    // Regenerar grid
    const grid = generarGridSopaLetras(palabras, size);

    seleccionSopa = [];
    sopaPalabrasEncontradas = [];

    // Actualizar grid
    const gridContainer = container.querySelector('.sopa-letras-grid');
    if (gridContainer) {
        gridContainer.innerHTML = '';
        grid.forEach((letra, i) => {
            const fila = Math.floor(i / size);
            const col = i % size;
            const celda = document.createElement('div');
            celda.className = 'sopa-letras-celda';
            celda.dataset.fila = fila;
            celda.dataset.col = col;
            celda.textContent = letra;
            celda.onclick = function() {
                seleccionarCeldaSopa(containerId, fila, col);
            };
            gridContainer.appendChild(celda);
        });
    }

    // Reiniciar palabras
    const palabrasContainer = container.querySelector('.sopa-letras-palabras');
    if (palabrasContainer) {
        palabrasContainer.innerHTML = '';
        palabras.forEach(palabra => {
            const span = document.createElement('span');
            span.className = 'sopa-letras-palabra';
            span.dataset.palabra = palabra;
            span.textContent = palabra;
            palabrasContainer.appendChild(span);
        });
    }

    // Limpiar feedback
    const feedback = document.getElementById(`sopa-feedback-${containerId}`);
    if (feedback) {
        feedback.innerHTML = '';
    }

    container.dataset.grid = JSON.stringify(grid);
    container.dataset.seleccionadas = JSON.stringify([]);
}

// ============================================
// 6. RECALCULAR SOPA DE LETRAS EN RESPONSIVE
// ============================================
window.addEventListener('resize', function() {
    // Recalcular el tamaño de las sopas de letras existentes
    const containers = document.querySelectorAll('.sopa-letras-container');
    containers.forEach(container => {
        const parentContainer = container.closest('[id^="actividad-sopa"]');
        if (parentContainer) {
            const palabras = JSON.parse(parentContainer.dataset.palabras || '[]');
            const gridSize = parseInt(parentContainer.dataset.size || 8);
            if (palabras.length > 0) {
                const anchoPantalla = window.innerWidth;
                let newSize = gridSize;
                if (anchoPantalla <= 400) {
                    newSize = Math.min(gridSize, 6);
                } else if (anchoPantalla <= 600) {
                    newSize = Math.min(gridSize, 8);
                }
                // Solo recrear si el tamaño cambió
                if (newSize !== gridSize) {
                    // Guardar referencia al ID
                    const containerId = parentContainer.id;
                    if (containerId) {
                        // Recrear con nuevo tamaño
                        const palabrasArray = JSON.parse(parentContainer.dataset.palabras);
                        const newGrid = generarGridSopaLetras(palabrasArray, newSize);
                        // Actualizar grid
                        const gridContainer = parentContainer.querySelector('.sopa-letras-grid');
                        if (gridContainer) {
                            gridContainer.style.gridTemplateColumns = `repeat(${newSize}, 1fr)`;
                            gridContainer.style.maxWidth = `${Math.min(newSize * 45, 400)}px`;
                            // Actualizar celdas
                            const celdas = gridContainer.querySelectorAll('.sopa-letras-celda');
                            celdas.forEach((celda, i) => {
                                if (i < newGrid.length) {
                                    celda.textContent = newGrid[i];
                                }
                            });
                            parentContainer.dataset.grid = JSON.stringify(newGrid);
                            parentContainer.dataset.size = newSize;
                        }
                    }
                }
            }
        }
    });
});