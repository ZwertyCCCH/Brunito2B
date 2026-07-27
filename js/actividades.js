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
// 2. ORDENAR SECUENCIA (VERSIÓN MEJORADA)
// ============================================
function iniciarOrdenar(containerId, elementos, ordenCorrecto) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Mezclar elementos
    const elementosMezclados = [...elementos];
    for (let i = elementosMezclados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elementosMezclados[i], elementosMezclados[j]] = [elementosMezclados[j], elementosMezclados[i]];
    }

    // Estado de orden
    let ordenActual = elementosMezclados.map(el => el.id);
    let ordenCorrectoFlag = false;
    let dragData = null;

    let html = `
        <div class="ordenar-container" id="ordenar-${containerId}">
            <p class="ordenar-instruccion">Arrastra los elementos al orden correcto.</p>
            <div class="ordenar-lista" id="ordenar-lista-${containerId}">
    `;

    elementosMezclados.forEach((el, i) => {
        html += `
            <div class="ordenar-item" data-id="${el.id}" data-index="${i}" style="cursor:grab;">
                <span class="ordenar-numero">${i + 1}</span>
                <span class="ordenar-texto">${el.texto}</span>
            </div>
        `;
    });

    html += `
            </div>
            <div id="ordenar-feedback-${containerId}" class="ordenar-feedback"></div>
        </div>
    `;

    container.innerHTML = html;

    // ==========================================
    // FUNCIÓN PARA VERIFICAR ORDEN AUTOMÁTICAMENTE
    // ==========================================
    function verificarOrdenAutomatico() {
        const items = container.querySelectorAll('.ordenar-item');
        const ordenActual = Array.from(items).map(item => item.dataset.id);
        const feedback = document.getElementById(`ordenar-feedback-${containerId}`);

        const esCorrecto = ordenActual.every((id, i) => id === ordenCorrecto[i]);

        if (esCorrecto && !ordenCorrectoFlag) {
            ordenCorrectoFlag = true;
            items.forEach(item => item.classList.add('correcto'));
            if (feedback) {
                feedback.innerHTML = `<div class="feedback-correcto">🎉 ¡Excelente! Has ordenado todos los elementos correctamente.</div>`;
            }
        } else if (!esCorrecto && ordenCorrectoFlag) {
            ordenCorrectoFlag = false;
            items.forEach(item => {
                item.classList.remove('correcto');
                item.classList.remove('incorrecto');
            });
            if (feedback) {
                feedback.innerHTML = '';
            }
        }
    }

    // ==========================================
    // EVENTOS PARA ESCRITORIO (DRAG & DROP NATIVO)
    // ==========================================
    const items = container.querySelectorAll('.ordenar-item');

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            if (ordenCorrectoFlag) return;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.id);
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
            if (ordenCorrectoFlag) return;

            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedItem = container.querySelector(`.ordenar-item[data-id="${draggedId}"]`);
            const targetItem = this;

            if (draggedItem && draggedItem !== targetItem) {
                const parent = targetItem.parentNode;
                const children = parent.querySelectorAll('.ordenar-item');
                const fromIndex = Array.from(children).indexOf(draggedItem);
                const toIndex = Array.from(children).indexOf(targetItem);

                if (fromIndex < toIndex) {
                    parent.insertBefore(draggedItem, targetItem.nextSibling);
                } else {
                    parent.insertBefore(draggedItem, targetItem);
                }

                // Actualizar números
                const nuevosItems = parent.querySelectorAll('.ordenar-item');
                nuevosItems.forEach((item, i) => {
                    item.querySelector('.ordenar-numero').textContent = i + 1;
                    item.dataset.index = i;
                });

                // Verificar orden automáticamente
                verificarOrdenAutomatico();
            }
        });
    });

    // ==========================================
    // EVENTOS TÁCTILES (MÓVILES/TABLETS)
    // ==========================================
    let touchDraggedItem = null;
    let touchClone = null;
    let touchStartIndex = null;

    items.forEach(item => {
        item.addEventListener('touchstart', function(e) {
            if (ordenCorrectoFlag) return;
            const touch = e.touches[0];
            touchDraggedItem = this;
            touchStartIndex = parseInt(this.dataset.index);

            // Crear clon visual
            touchClone = this.cloneNode(true);
            touchClone.style.position = 'fixed';
            touchClone.style.left = (touch.clientX - this.offsetWidth / 2) + 'px';
            touchClone.style.top = (touch.clientY - this.offsetHeight / 2) + 'px';
            touchClone.style.width = this.offsetWidth + 'px';
            touchClone.style.zIndex = '1000';
            touchClone.style.opacity = '0.9';
            touchClone.style.transform = 'scale(1.05)';
            touchClone.style.pointerEvents = 'none';
            touchClone.style.margin = '0';
            document.body.appendChild(touchClone);

            this.style.opacity = '0.3';
        }, { passive: true });

        item.addEventListener('touchmove', function(e) {
            if (!touchDraggedItem || !touchClone || ordenCorrectoFlag) return;
            e.preventDefault();

            const touch = e.touches[0];
            touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
            touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';

            // Resaltar elemento bajo el dedo
            const elementoDebajo = document.elementFromPoint(touch.clientX, touch.clientY);
            const itemDebajo = elementoDebajo ? elementoDebajo.closest('.ordenar-item') : null;

            container.querySelectorAll('.ordenar-item').forEach(el => {
                if (el !== touchDraggedItem) {
                    el.style.borderColor = '#d0e0fc';
                    el.style.backgroundColor = 'white';
                }
            });

            if (itemDebajo && itemDebajo !== touchDraggedItem) {
                itemDebajo.style.borderColor = '#4A90D9';
                itemDebajo.style.backgroundColor = '#e8f0fe';
            }
        }, { passive: false });

        item.addEventListener('touchend', function(e) {
            if (!touchDraggedItem || ordenCorrectoFlag) {
                if (touchClone) {
                    touchClone.remove();
                    touchClone = null;
                }
                touchDraggedItem = null;
                return;
            }

            const touch = e.changedTouches[0];
            const elementoDebajo = document.elementFromPoint(touch.clientX, touch.clientY);
            const itemDebajo = elementoDebajo ? elementoDebajo.closest('.ordenar-item') : null;

            // Eliminar clon
            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }

            // Restaurar opacidad
            touchDraggedItem.style.opacity = '1';

            // Limpiar estilos
            container.querySelectorAll('.ordenar-item').forEach(el => {
                el.style.borderColor = '#d0e0fc';
                el.style.backgroundColor = 'white';
            });

            if (itemDebajo && itemDebajo !== touchDraggedItem) {
                const parent = touchDraggedItem.parentNode;
                const children = parent.querySelectorAll('.ordenar-item');
                const fromIndex = Array.from(children).indexOf(touchDraggedItem);
                const toIndex = Array.from(children).indexOf(itemDebajo);

                if (fromIndex < toIndex) {
                    parent.insertBefore(touchDraggedItem, itemDebajo.nextSibling);
                } else {
                    parent.insertBefore(touchDraggedItem, itemDebajo);
                }

                // Actualizar números
                const nuevosItems = parent.querySelectorAll('.ordenar-item');
                nuevosItems.forEach((item, i) => {
                    item.querySelector('.ordenar-numero').textContent = i + 1;
                    item.dataset.index = i;
                });

                // Verificar orden automáticamente
                verificarOrdenAutomatico();
            }

            touchDraggedItem = null;
            touchStartIndex = null;
        });

        item.addEventListener('touchcancel', function() {
            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }
            if (touchDraggedItem) {
                touchDraggedItem.style.opacity = '1';
                touchDraggedItem = null;
            }
            touchStartIndex = null;
        });
    });

    // ==========================================
    // VERIFICACIÓN INICIAL (por si ya está ordenado)
    // ==========================================
    verificarOrdenAutomatico();
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
// 5. RELACIONAR COLUMNAS (MATCHING)
// ============================================
function iniciarMatching(containerId, pares) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // pares: Array de objetos { id, izquierda, derecha }
    // Ejemplo: { id: '1', izquierda: 'Océano', derecha: 'Gran masa de agua salada' }

    // Mezclar elementos izquierda y derecha por separado
    const izquierda = [...pares];
    const derecha = [...pares];
    for (let i = izquierda.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [izquierda[i], izquierda[j]] = [izquierda[j], izquierda[i]];
    }
    for (let i = derecha.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [derecha[i], derecha[j]] = [derecha[j], derecha[i]];
    }

    let seleccionados = { izquierda: null, derecha: null };
    let parejasEncontradas = 0;
    const totalPares = pares.length;

    let html = `
        <div class="matching-container" id="matching-${containerId}">
            <p class="matching-instruccion">Haz clic en un elemento de la izquierda y luego en su pareja de la derecha.</p>
            <div class="matching-grid">
                <div class="matching-columna matching-izquierda">
    `;

    izquierda.forEach((item) => {
        const encontrado = item.encontrado || false;
        html += `
            <div class="matching-item ${encontrado ? 'encontrado' : ''}" 
                 data-id="${item.id}" 
                 data-lado="izquierda"
                 ${encontrado ? 'style="opacity:0.4;pointer-events:none;"' : ''}
                 onclick="seleccionarMatching('${containerId}', '${item.id}', 'izquierda')">
                ${item.izquierda}
            </div>
        `;
    });

    html += `
                </div>
                <div class="matching-columna matching-derecha">
    `;

    derecha.forEach((item) => {
        const encontrado = item.encontrado || false;
        html += `
            <div class="matching-item ${encontrado ? 'encontrado' : ''}" 
                 data-id="${item.id}" 
                 data-lado="derecha"
                 ${encontrado ? 'style="opacity:0.4;pointer-events:none;"' : ''}
                 onclick="seleccionarMatching('${containerId}', '${item.id}', 'derecha')">
                ${item.derecha}
            </div>
        `;
    });

    html += `
                </div>
            </div>
            <div id="matching-feedback-${containerId}" class="matching-feedback"></div>
        </div>
    `;

    container.innerHTML = html;

    // Guardar pares en el container
    container.dataset.pares = JSON.stringify(pares);
    container.dataset.seleccionados = JSON.stringify({ izquierda: null, derecha: null });
    container.dataset.parejasEncontradas = '0';
}

// ============================================
// SELECCIONAR ELEMENTO EN MATCHING
// ============================================
function seleccionarMatching(containerId, id, lado) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Si el elemento ya está encontrado, no hacer nada
    const itemElement = container.querySelector(`.matching-item[data-id="${id}"][data-lado="${lado}"]`);
    if (itemElement && itemElement.classList.contains('encontrado')) return;

    const pares = JSON.parse(container.dataset.pares);
    const seleccionados = JSON.parse(container.dataset.seleccionados);
    const feedback = document.getElementById(`matching-feedback-${containerId}`);

    // Si selecciona el mismo lado que ya tenía, deseleccionar
    if (seleccionados[lado] === id) {
        seleccionados[lado] = null;
        container.dataset.seleccionados = JSON.stringify(seleccionados);
        // Limpiar estilos de selección
        container.querySelectorAll(`.matching-item[data-lado="${lado}"]`).forEach(el => {
            el.classList.remove('seleccionado');
        });
        return;
    }

    // Si el lado está ocupado, limpiar la selección anterior en ese lado
    if (seleccionados[lado] !== null) {
        const anterior = container.querySelector(`.matching-item[data-id="${seleccionados[lado]}"][data-lado="${lado}"]`);
        if (anterior) anterior.classList.remove('seleccionado');
    }

    // Seleccionar el nuevo elemento
    seleccionados[lado] = id;
    container.dataset.seleccionados = JSON.stringify(seleccionados);
    itemElement.classList.add('seleccionado');

    // Si ya hay selección en ambos lados, verificar pareja
    if (seleccionados.izquierda !== null && seleccionados.derecha !== null) {
        const idIzquierda = seleccionados.izquierda;
        const idDerecha = seleccionados.derecha;

        // Buscar si coinciden
        const pareja = pares.find(p => p.id === idIzquierda);
        const coincide = pareja && pareja.id === idDerecha;

        if (coincide) {
            // ✅ Correcto: marcar ambos como encontrados
            const itemIzq = container.querySelector(`.matching-item[data-id="${idIzquierda}"][data-lado="izquierda"]`);
            const itemDer = container.querySelector(`.matching-item[data-id="${idDerecha}"][data-lado="derecha"]`);
            if (itemIzq) {
                itemIzq.classList.remove('seleccionado');
                itemIzq.classList.add('encontrado');
                itemIzq.style.opacity = '0.4';
                itemIzq.style.pointerEvents = 'none';
            }
            if (itemDer) {
                itemDer.classList.remove('seleccionado');
                itemDer.classList.add('encontrado');
                itemDer.style.opacity = '0.4';
                itemDer.style.pointerEvents = 'none';
            }

            parejasEncontradas = parseInt(container.dataset.parejasEncontradas) + 1;
            container.dataset.parejasEncontradas = parejasEncontradas;

            if (feedback) {
                feedback.innerHTML = `<div class="feedback-correcto">✅ ¡Correcto! "${pareja.izquierda}" = "${pareja.derecha}"</div>`;
                setTimeout(() => feedback.innerHTML = '', 2000);
            }

            // Limpiar selección
            seleccionados.izquierda = null;
            seleccionados.derecha = null;
            container.dataset.seleccionados = JSON.stringify(seleccionados);

            // Verificar si se completó todo
            if (parejasEncontradas === totalPares) {
                if (feedback) {
                    feedback.innerHTML = `<div class="feedback-correcto">🎉 ¡Excelente! Has relacionado todos los conceptos correctamente.</div>`;
                }
            }
        } else {
            // ❌ Incorrecto: mostrar mensaje y deseleccionar
            if (feedback) {
                feedback.innerHTML = `<div class="feedback-incorrecto">❌ No coinciden. Intenta de nuevo.</div>`;
                setTimeout(() => feedback.innerHTML = '', 1500);
            }

            // Limpiar selecciones
            const itemIzq = container.querySelector(`.matching-item[data-id="${idIzquierda}"][data-lado="izquierda"]`);
            const itemDer = container.querySelector(`.matching-item[data-id="${idDerecha}"][data-lado="derecha"]`);
            if (itemIzq) itemIzq.classList.remove('seleccionado');
            if (itemDer) itemDer.classList.remove('seleccionado');

            seleccionados.izquierda = null;
            seleccionados.derecha = null;
            container.dataset.seleccionados = JSON.stringify(seleccionados);
        }
    }
}

// ============================================
// 6. SOPA DE LETRAS - REINICIAR (función auxiliar)
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
// RECALCULAR SOPA DE LETRAS EN RESPONSIVE
// ============================================
/*window.addEventListener('resize', function() {
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
});*/
// ============================================
// 7. VERDADERO O FALSO
// ============================================
function iniciarVerdaderoFalso(containerId, preguntas) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // preguntas: Array de objetos { id, texto, respuestaCorrecta (true/false), explicacion }
    let respuestas = new Array(preguntas.length).fill(null);
    let preguntasRespondidas = 0;

    let html = `
        <div class="vf-container" id="vf-${containerId}">
            <p class="vf-instruccion">Lee cada afirmación y selecciona si es <strong>Verdadera</strong> o <strong>Falsa</strong>.</p>
            <div class="vf-preguntas">
    `;

    preguntas.forEach((pregunta, index) => {
        const respondido = respuestas[index] !== null;
        const respuestaUsuario = respuestas[index];
        const esCorrecta = respondido ? (respuestaUsuario === pregunta.respuestaCorrecta) : null;

        html += `
            <div class="vf-item" id="vf-item-${index}" data-index="${index}">
                <div class="vf-texto">
                    <span class="vf-numero">${index + 1}.</span>
                    <span class="vf-enunciado">${pregunta.texto}</span>
                </div>
                <div class="vf-botones">
                    <button class="vf-btn vf-verdadero ${respondido && respuestaUsuario === true ? 'seleccionado' : ''} ${respondido ? 'deshabilitado' : ''}" 
                            onclick="responderVF('${containerId}', ${index}, true)"
                            ${respondido ? 'disabled' : ''}>
                        ✅ Verdadero
                    </button>
                    <button class="vf-btn vf-falso ${respondido && respuestaUsuario === false ? 'seleccionado' : ''} ${respondido ? 'deshabilitado' : ''}" 
                            onclick="responderVF('${containerId}', ${index}, false)"
                            ${respondido ? 'disabled' : ''}>
                        ❌ Falso
                    </button>
                </div>
                ${respondido ? `
                    <div class="vf-feedback ${esCorrecta ? 'vf-correcto' : 'vf-incorrecto'}">
                        ${esCorrecta ? '✅ ¡Correcto!' : '❌ Incorrecto. ' + pregunta.explicacion}
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += `
            </div>
            <div id="vf-feedback-${containerId}" class="vf-feedback-general"></div>
        </div>
    `;

    container.innerHTML = html;
    container.dataset.preguntas = JSON.stringify(preguntas);
    container.dataset.respuestas = JSON.stringify(respuestas);
    container.dataset.respondidas = '0';
}

// ============================================
// RESPONDER VERDADERO O FALSO
// ============================================
function responderVF(containerId, index, respuesta) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const preguntas = JSON.parse(container.dataset.preguntas);
    const respuestas = JSON.parse(container.dataset.respuestas);

    // Si ya respondió, no hacer nada
    if (respuestas[index] !== null) return;

    // Guardar respuesta
    respuestas[index] = respuesta;
    container.dataset.respuestas = JSON.stringify(respuestas);

    const esCorrecta = respuesta === preguntas[index].respuestaCorrecta;
    const item = document.getElementById(`vf-item-${index}`);

    // Deshabilitar botones
    const botones = item.querySelectorAll('.vf-btn');
    botones.forEach(btn => {
        btn.classList.add('deshabilitado');
        btn.disabled = true;
    });

    // Marcar el botón seleccionado
    const btnSeleccionado = item.querySelector(respuesta ? '.vf-verdadero' : '.vf-falso');
    if (btnSeleccionado) btnSeleccionado.classList.add('seleccionado');

    // Mostrar feedback
    const feedback = document.createElement('div');
    feedback.className = `vf-feedback ${esCorrecta ? 'vf-correcto' : 'vf-incorrecto'}`;
    feedback.textContent = esCorrecta ? '✅ ¡Correcto!' : `❌ Incorrecto. ${preguntas[index].explicacion}`;
    item.appendChild(feedback);

    // Actualizar contador
    let respondidas = parseInt(container.dataset.respondidas) + 1;
    container.dataset.respondidas = respondidas;

    const totalPreguntas = preguntas.length;

    // Verificar si todas las preguntas están respondidas
    if (respondidas === totalPreguntas) {
        const feedbackGeneral = document.getElementById(`vf-feedback-${containerId}`);
        const correctas = respuestas.filter((r, i) => r === preguntas[i].respuestaCorrecta).length;
        if (feedbackGeneral) {
            feedbackGeneral.innerHTML = `
                <div class="feedback-correcto">
                    🎉 ¡Has completado todas las preguntas! 
                    <br>✅ ${correctas} de ${totalPreguntas} correctas.
                </div>
            `;
        }
    }
}