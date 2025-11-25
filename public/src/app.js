// src/app.js
import './style.css';
import { storage, db } from "./firebase"
import logoUrl from './assets/logo-transparente.png';
import logoCarrito from './assets/ic-carrito.png';

import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL } from "firebase/storage"


const sliderFolderRef = ref(storage, "slider"); // carpeta en Storage donde guardas las imágenes

let articulos = JSON.parse(localStorage.getItem("articulos")) || [];
let carrito = [];

const logo = document.getElementById("logo");
const lista = document.getElementById("lista-articulos-index");
const carritoLista = document.getElementById("carrito-lista");
const carritoTotal = document.getElementById("carrito-total");
const carritoCount = document.getElementById("carrito-count");
const carritoIcono = document.getElementById("carrito-icono");
const btnCarrito = document.getElementById("btn-carrito");
const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
const btnEnviarWhatsapp = document.getElementById("btn-enviar-whatsapp");
let paginaActual = 1;
const productosPorPagina = 8;

logo.src = logoUrl;
carritoIcono.src = logoCarrito;

btnCarrito.onclick = function () {
    mostrarCarrito();
}
btnVaciarCarrito.onclick = function () {
    vaciarCarrito();
}
btnEnviarWhatsapp.onclick = function () {
    enviarPorWhatsApp();
}


let config = {};

async function aplicarConfiguracion() {
    try {
        // Referencia al documento de configuración en Firestore
        const configRef = doc(db, "configuracion", "tienda");
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
            config = configSnap.data();

            // Aplicar valores al DOM
            document.getElementById("nombre-tienda-portada").textContent = config.nombre || "";
            document.getElementById("descripcion").textContent = config.descripcion;
            document.getElementById("link-instagram-footer").href = config.instagram || "#";
            document.getElementById("link-facebook-footer").href = config.facebook || "#";
            //document.getElementById("numero-whatsapp-footer").textContent = config.whatsapp || "";
            document.getElementById("link-whatsapp-footer").href = config.whatsapp
                ? `https://wa.me/549${config.whatsapp}`
                : "#";
        } else {
            console.warn("No se encontró la configuración en Firestore.");
        }
    } catch (error) {
        console.error("Error al traer configuración desde Firestore:", error);
    }
}

async function renderizarSlider() {
    const track = document.getElementById("slider-track");
    track.innerHTML = "";

    try {
        // Listar todas las imágenes dentro de la carpeta "slider"
        const result = await listAll(sliderFolderRef);

        // Obtener las URLs de descarga
        const urls = await Promise.all(
            result.items.map(itemRef => getDownloadURL(itemRef))
        );

        // Renderizar cada imagen en el slider
        urls.forEach(url => {
            const slide = document.createElement("img");
            slide.src = url;
            slide.alt = "Slide";
            track.appendChild(slide);
        });

        iniciarAnimacionSlider(urls.length);
    } catch (error) {
        console.error("Error cargando imágenes del slider:", error);
    }
}

function iniciarAnimacionSlider(totalSlides) {
    const track = document.getElementById("slider-track");
    let sliderIndex = 0;

    setInterval(() => {
        sliderIndex = (sliderIndex + 1) % totalSlides;
        track.style.transform = `translateX(-${sliderIndex * 100}vw)`;
    }, 4000); // cambia cada 4 segundos
}

async function renderizarArticulos() {
    lista.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "articulos"));
        let activos = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.activo) {
                activos.push({ id: doc.id, ...data });
            }
        });

        // 🔹 Actualizar la variable global
        articulos = activos;

        // Paginación
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const pagina = activos.slice(inicio, fin);

        // Renderizar cada artículo
        pagina.forEach((a) => {
            const div = document.createElement("div");
            div.className = "articulo";
            div.innerHTML = `
                <img src="${a.foto}" alt="${a.titulo}" />
                <h3>${a.titulo}</h3>
                <p>${a.descripcion}</p>
                <p>Precio: $${a.precio}</p>
                <p>Stock: ${a.stock}</p>
                <button ${a.stock === 0 ? "disabled" : ""} onclick="agregarAlCarrito('${a.id}')">
                  ${a.stock === 0 ? "Sin stock" : "Agregar al carrito"}
                </button>
            `;
            lista.appendChild(div);
        });

        renderizarPaginacion(activos.length);

    } catch (error) {
        console.error("Error al cargar artículos:", error);
    }
}


// Agregar al carrito y restar stock en Firestore
async function agregarAlCarrito(id) {
    const art = articulos.find(a => a.id === id);

    if (!art) {
        console.error("Artículo no encontrado:", id);
        return;
    }

    const existente = carrito.find(a => a.id === art.id);
    const cantidadEnCarrito = existente ? existente.cantidad || 1 : 0;

    if (art.stock > cantidadEnCarrito) {
        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({ ...art, cantidad: 1 });
        }

        carritoCount.textContent = carrito.reduce((acc, a) => acc + a.cantidad, 0);
        carritoCount.classList.add("rebote");
        setTimeout(() => carritoCount.classList.remove("rebote"), 400);
        renderizarCarrito();
    } else {
        alert("No hay suficiente stock disponible.");
    }
}


// 🔹 Renderizar carrito (sin cambios grandes)
function renderizarCarrito() {
    carritoLista.innerHTML = "";
    let total = 0;
    carrito.forEach((a) => {
        carritoLista.innerHTML += `<li>${a.titulo} x${a.cantidad || 1} - $${a.precio * (a.cantidad || 1)}</li>`;
        total += a.precio * (a.cantidad || 1);
    });
    carritoTotal.textContent = total;
}

// 🔹 Mostrar carrito (igual que antes)
function mostrarCarrito() {
    const carrito = document.getElementById("carrito");
    carrito.classList.toggle("oculto");
    if (!carrito.classList.contains("oculto")) {
        carrito.classList.add("animar-carrito");
        setTimeout(() => carrito.classList.remove("animar-carrito"), 500);
    }
}

// 🔹 Vaciar carrito y reintegrar stock en Firestore
async function vaciarCarrito() {
    carrito = [];
    carritoCount.textContent = 0;
    renderizarCarrito();
}

document.getElementById("btn-cerrar-carrito").addEventListener("click", () => {
    document.getElementById("carrito").classList.add("oculto");
});


// 🔹 Enviar pedido por WhatsApp y restar stock definitivamente
async function enviarPorWhatsApp() {
    const nombre = document.getElementById("nombre-usuario").value.trim();
    if (!nombre) return alert("Por favor ingresá tu nombre.");
    if (carrito.length === 0) return alert("El carrito está vacío.");

    let resumen = `Hola, soy ${nombre} y quiero comprar:\n`;
    let total = 0;
    carrito.forEach(item => {
        const cantidad = item.cantidad || 1;
        resumen += `• ${item.titulo} x${cantidad} - $${item.precio * cantidad}\n`;
        total += item.precio * cantidad;
    });
    resumen += `\nTotal: $${total}`;

    if (!confirm("¿Confirmás el pedido por WhatsApp?\n\n" + resumen)) return;

    // Restar stock definitivamente en Firestore
    for (const item of carrito) {
        const artRef = doc(db, "articulos", item.id);
        const artSnap = await getDoc(artRef);
        if (artSnap.exists()) {
            const artData = artSnap.data();
            await updateDoc(artRef, { stock: artData.stock - item.cantidad });
        }
    }

    renderizarArticulos();
    carrito = [];
    renderizarCarrito();
    carritoCount.textContent = 0;

    const url = `https://wa.me/${config.wa}?text=${encodeURIComponent(resumen)}`;
    window.open(url, "_blank");
}

/*
function agregarAlCarrito(index) {
    const art = articulos[index];
    const existente = carrito.find(a => a.id === art.id);
    const cantidadEnCarrito = existente ? existente.cantidad || 1 : 0;

    if (art.stock > cantidadEnCarrito) {
        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({ ...art, cantidad: 1 });
        }
        carritoCount.textContent = carrito.reduce((acc, a) => acc + a.cantidad, 0);
        carritoCount.classList.add("rebote");
        setTimeout(() => carritoCount.classList.remove("rebote"), 400);
        renderizarCarrito();
    } else {
        alert("No hay suficiente stock disponible.");
    }
}

function renderizarCarrito() {
    carritoLista.innerHTML = "";
    let total = 0;
    carrito.forEach((a) => {
        carritoLista.innerHTML += `<li>${a.titulo} x${a.cantidad || 1} - $${a.precio * (a.cantidad || 1)}</li>`;
        total += a.precio * (a.cantidad || 1);
    });
    carritoTotal.textContent = total;
}

function mostrarCarrito() {
    const carrito = document.getElementById("carrito");
    carrito.classList.toggle("oculto");
    if (!carrito.classList.contains("oculto")) {
        carrito.classList.add("animar-carrito");
        setTimeout(() => carrito.classList.remove("animar-carrito"), 500);
    }
}

function vaciarCarrito() {
    carrito = [];
    carritoCount.textContent = 0;
    renderizarCarrito();
}


function enviarPorWhatsApp() {
    const nombre = document.getElementById("nombre-usuario").value.trim();
    if (!nombre) return alert("Por favor ingresá tu nombre.");
    if (carrito.length === 0) return alert("El carrito está vacío.");

    let resumen = `Hola, soy ${nombre} y quiero comprar:\n`;
    let total = 0;
    carrito.forEach(item => {
        const cantidad = item.cantidad || 1;
        resumen += `• ${item.titulo} x${cantidad} - $${item.precio * cantidad}\n`;
        total += item.precio * cantidad;
    });
    resumen += `\nTotal: $${total}`;

    if (!confirm("¿Confirmás el pedido por WhatsApp?\n\n" + resumen)) return;

    carrito.forEach(item => {
        const index = articulos.findIndex(a => a.id === item.id);
        if (index !== -1) articulos[index].stock -= item.cantidad || 1;
    });

    localStorage.setItem("articulos", JSON.stringify(articulos));
    renderizarArticulos();
    carrito = [];
    renderizarCarrito();
    carritoCount.textContent = 0;

    const url = `https://wa.me/549${config.redes.whatsapp}?text=${encodeURIComponent(resumen)}`;
    window.open(url, "_blank");
} */

function renderizarPaginacion(total) {
    const totalPaginas = Math.ceil(total / productosPorPagina);
    const paginador = document.getElementById("paginador");
    paginador.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = i === paginaActual ? "activo" : "";
        btn.onclick = () => {
            paginaActual = i;
            renderizarArticulos();
        };
        paginador.appendChild(btn);
    }
}


function mostrarNotificacionCarrito(texto) {
    const noti = document.getElementById("notificacion-carrito");
    noti.textContent = texto;
    noti.classList.add("mostrar");
    setTimeout(() => {
        noti.classList.remove("mostrar");
    }, 3000);
}

// Inicializar
window.agregarAlCarrito = agregarAlCarrito;
aplicarConfiguracion();
renderizarSlider();
renderizarArticulos();
