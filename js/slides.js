// ============================================
// SLIDES.JS - Navegación de diapositivas
// ============================================

let slidesActual = 0;
let slidesTotal = 0;
let slidesContainer = null;
let touchStartX = 0;
let touchEndX = 0;

// ============================================
// INICIAR NAVEGACIÓN DE DIAPOSITIVAS
// ============================================
function iniciarSlides(containerId) {
    slidesContainer = document.getElementById(containerId);
    if (!slidesContainer) return;

    const diapositivas = slidesContainer.querySelectorAll('.diapositiva');
    slidesTotal = diapositivas.length;

    if (slidesTotal === 0) return;

    // Mostrar la primera diapositiva
    irASlide(0);

    // Eventos de teclado (flechas)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            slideAnterior();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            slideSiguiente();
        }
    });

    // Eventos táctiles (deslizar como Tinder)
    slidesContainer.addEventListener('touchstart', function(event) {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    slidesContainer.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // Actualizar footer
    actualizarFooter();
}

// ============================================
// IR A UN SLIDE ESPECÍFICO
// ============================================
function irASlide(index) {
    if (!slidesContainer) return;
    if (index < 0 || index >= slidesTotal) return;

    slidesActual = index;

    const diapositivas = slidesContainer.querySelectorAll('.diapositiva');
    diapositivas.forEach((slide, i) => {
        slide.classList.toggle('activa', i === index);
    });

    // Scroll al top de la diapositiva
    slidesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Actualizar indicadores y footer
    actualizarIndicadores();
    actualizarFooter();
}

// ============================================
// SLIDE ANTERIOR
// ============================================
function slideAnterior() {
    if (slidesActual > 0) {
        irASlide(slidesActual - 1);
    }
}

// ============================================
// SLIDE SIGUIENTE
// ============================================
function slideSiguiente() {
    if (slidesActual < slidesTotal - 1) {
        irASlide(slidesActual + 1);
    }
}

// ============================================
// MANEJAR DESLIZAMIENTO TÁCTIL
// ============================================
function handleSwipe() {
    const threshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
        // Deslizó a la izquierda → siguiente
        slideSiguiente();
    } else {
        // Deslizó a la derecha → anterior
        slideAnterior();
    }
}

// ============================================
// ACTUALIZAR INDICADORES (puntos)
// ============================================
function actualizarIndicadores() {
    const indicador = document.getElementById('indicador-slides');
    if (!indicador) return;

    let html = '';
    for (let i = 0; i < slidesTotal; i++) {
        html += `<span class="punto-slide ${i === slidesActual ? 'activo' : ''}" 
                       onclick="irASlide(${i})"></span>`;
    }
    indicador.innerHTML = html;
}

// ============================================
// ACTUALIZAR FOOTER (botones fijos)
// ============================================
function actualizarFooter() {
    const footer = document.getElementById('footer-slides');
    if (!footer) return;

    const esUltima = slidesActual === slidesTotal - 1;

    let html = `
        <button class="btn-slide btn-anterior" onclick="slideAnterior()" 
                ${slidesActual === 0 ? 'disabled' : ''}>
            ◀
        </button>
        <span class="slide-contador">${slidesActual + 1} / ${slidesTotal}</span>
        <button class="btn-slide btn-siguiente" onclick="slideSiguiente()" 
                ${esUltima ? 'disabled' : ''}>
            ▶
        </button>
    `;

    // Si es la última diapositiva, mostrar botones de acción
    if (esUltima) {
        // Obtener URLs desde atributos data del footer
        const urlVolver = footer.dataset.volver || '../index.html';
        const urlEjercicio = footer.dataset.ejercicio || '../ejercicios/E1.html';

        html += `
            <div class="acciones-finales">
                <a href="${urlVolver}" class="btn-accion btn-volver">📖 Volver</a>
                <a href="${urlEjercicio}" class="btn-accion btn-ejercicio">✏️ Ejercicio</a>
            </div>
        `;
    }

    footer.innerHTML = html;
}

// ============================================
// INICIALIZAR DESDE EL HTML
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Auto-inicializar si existe el contenedor
    const container = document.getElementById('contenedor-slides');
    if (container) {
        iniciarSlides('contenedor-slides');
    }
});