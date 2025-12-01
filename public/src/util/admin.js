// src/app.js
import '../styles/admin.css';
import logoUrl from '../assets/logo-transparente.png';
import { storage, db, auth } from '../util/firebase';
import { doc, setDoc, getDocs, getDoc, addDoc, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado → mostrar panel
        renderizarAdmin();
    } else {
        // No autenticado → redirigir a login
        window.location.href = "./login.html";
    }
});

const logo = document.getElementById("logo");
const btnAgregarSlider = document.getElementById("btn-agregar-slider");
const btnGuardarConfiguracion = document.getElementById("btn-guardar-configuracion");
const btnLogout = document.getElementById("btn-logout");
const form = document.getElementById("form-articulo");

let articulosAdmin = [];
let paginaAdminActual = 1;
const productosPorPaginaAdmin = 8;

logo.src = logoUrl;

btnAgregarSlider.onclick = function () {
    agregarSlider();
}
btnGuardarConfiguracion.onclick = function () {
    guardarConfiguracion();
}

btnLogout.onclick = function () {
    logout();
}


async function logout() {
    await signOut(auth);
    console.log("Sesión cerrada");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);
    const stock = parseInt(document.getElementById("stock").value);
    const fotoInput = document.getElementById("foto");

    if (!fotoInput.files[0]) {
        mostrarMensaje("Falta la imagen del producto", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function () {
        const img = new Image();
        img.onload = async function () {
            try {
                // Reducir imagen en canvas
                const canvas = document.createElement("canvas");
                const scale = Math.min(400 / img.width, 400 / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imagenReducida = canvas.toDataURL("image/jpeg", 0.7);

                // Subir imagen a Storage
                const fileName = `articulos/${Date.now()}_${fotoInput.files[0].name}`;
                const storageRef = ref(storage, fileName);
                await uploadString(storageRef, imagenReducida, "data_url");

                // Obtener URL pública
                const fotoURL = await getDownloadURL(storageRef);

                // Guardar artículo en Firestore
                const nuevoArticulo = {
                    titulo,
                    descripcion,
                    precio,
                    stock,
                    foto: fotoURL,
                    activo: true,
                    creado: new Date()
                };

                await addDoc(collection(db, "articulos"), nuevoArticulo);

                form.reset();
                mostrarMensaje("Producto guardado correctamente en Firestore", "exito");
                renderizarAdmin(); // refrescar lista desde Firestore
            } catch (error) {
                console.error("Error al guardar artículo:", error);
                mostrarMensaje("Error al guardar artículo", "error");
            }
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(fotoInput.files[0]);
});

// 🔹 Renderizar artículos en el panel admin con paginación
async function renderizarAdmin() {
    const lista = document.getElementById("lista-articulos");
    lista.innerHTML = "";

    try {
        mostrarMensaje("Bienvenido")
        // 1. Leer artículos desde Firestore
        const querySnapshot = await getDocs(collection(db, "articulos"));
        articulosAdmin = []; // reiniciar global
        querySnapshot.forEach((doc) => {
            articulosAdmin.push({ id: doc.id, ...doc.data() });
        });

        // 2. Paginación
        const inicio = (paginaAdminActual - 1) * productosPorPaginaAdmin;
        const fin = inicio + productosPorPaginaAdmin;
        const pagina = articulosAdmin.slice(inicio, fin);

        // 3. Renderizar cada artículo
        pagina.forEach((a) => {
            const card = document.createElement("div");
            card.className = "admin-card";

            card.innerHTML = `
                <img src="${a.foto}" alt="${a.titulo}" />
                <div class="admin-info">
                  <input value="${a.titulo}" disabled />
                  <textarea disabled>${a.descripcion}</textarea>
                  <input type="number" value="${a.precio}" disabled />
                  <input type="number" value="${a.stock}" disabled />
                  <div class="botones">
                    <button class="editar" onclick="toggleEdicion(this, '${a.id}')">Editar</button>
                    <button class="borrar" onclick="eliminarArticulo('${a.id}', '${a.foto}')">Eliminar</button>
                  </div>
                </div>
            `;
            lista.appendChild(card);
        });

        // 4. Renderizar paginador
        renderizarPaginadorAdmin();

    } catch (error) {
        console.error("Error al cargar artículos en admin:", error);
        mostrarMensaje("Error al cargar artículos desde Firestore", "error");
    }
}

// 🔹 Renderizar paginador admin
function renderizarPaginadorAdmin() {
    const totalPaginas = Math.ceil(articulosAdmin.length / productosPorPaginaAdmin);
    const paginador = document.getElementById("paginador-admin");
    paginador.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = i === paginaAdminActual ? "activo" : "";
        btn.onclick = () => {
            paginaAdminActual = i;
            renderizarAdmin();
        };
        paginador.appendChild(btn);
    }
}

// Editar artículo en Firestore
async function toggleEdicion(boton, id) {
    const card = boton.closest(".admin-card");
    const inputs = card.querySelectorAll("input, textarea");
    const modoEdicion = boton.textContent === "Editar";

    inputs.forEach(el => el.disabled = !modoEdicion);

    if (modoEdicion) {
        boton.textContent = "Guardar";
        card.classList.add("editando");
    } else {
        try {
            const [titulo, descripcion, precio, stock] = inputs;

            await updateDoc(doc(db, "articulos", id), {
                titulo: titulo.value.trim(),
                descripcion: descripcion.value.trim(),
                precio: parseFloat(precio.value),
                stock: parseInt(stock.value)
            });

            boton.textContent = "Editar";
            card.classList.remove("editando");
            mostrarMensaje("Producto actualizado correctamente en Firestore", "exito");
            renderizarAdmin(); // refrescar lista
        } catch (error) {
            console.error("Error al actualizar artículo:", error);
            mostrarMensaje("Error al actualizar artículo", "error");
        }
    }
}

// Eliminar artículo de Firestore y foto de Storage
async function eliminarArticulo(id, fotoURL) {
    const confirmacion = confirm(`¿Eliminar este artículo?`);
    if (!confirmacion) return;

    try {
        // 1. Eliminar documento en Firestore
        await deleteDoc(doc(db, "articulos", id));

        // 2. Eliminar imagen en Storage (si existe)
        if (fotoURL) {
            const fotoRef = ref(storage, fotoURL);
            await deleteObject(fotoRef);
        }

        mostrarMensaje("Producto eliminado correctamente", "exito");
        renderizarAdmin(); // refrescar lista
    } catch (error) {
        console.error("Error al eliminar artículo:", error);
        mostrarMensaje("Error al eliminar artículo", "error");
    }
}

function mostrarMensaje(texto, tipo = "exito") {
    const noti = document.getElementById("notificacion");
    noti.textContent = texto;
    noti.className = `notificacion mostrar ${tipo}`;
    setTimeout(() => {
        noti.classList.remove("mostrar");
    }, 3000);
}

async function agregarSlider() {
    const input = document.getElementById("slider-imagen");
    if (!input.files[0]) return;

    try {
        const file = input.files[0];
        const fileName = `slider/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);

        // 1. Subir imagen a Storage
        await uploadBytes(storageRef, file);

        // 2. Obtener URL pública
        const url = await getDownloadURL(storageRef);

        // 3. Crear un documento en la colección "slider"
        await addDoc(collection(db, "slider"), {
            url: url,
            nombre: file.name,
            creado: new Date()
        });

        renderizarSlider();
        mostrarMensaje("Imagen agregada al slider", "exito");
    } catch (error) {
        console.error("Error al subir imagen al slider:", error);
        mostrarMensaje("Error al subir imagen", "error");
    }
}

async function eliminarSlider(id, url) {
    try {
        // 1. Eliminar imagen de Storage
        if (url) {
            const fotoRef = ref(storage, url);
            await deleteObject(fotoRef);
        }

        // 2. Eliminar documento de Firestore
        await deleteDoc(doc(db, "slider", id));

        // 3. Refrescar preview
        renderizarSlider();
        mostrarMensaje("Imagen eliminada del slider", "exito");
    } catch (error) {
        console.error("Error al eliminar imagen del slider:", error);
        mostrarMensaje("Error al eliminar imagen", "error");
    }
}

async function renderizarSlider() {
    const preview = document.getElementById("slider-preview");
    preview.innerHTML = "";

    try {
        // 1. Leer todos los documentos de la colección "slider"
        const querySnapshot = await getDocs(collection(db, "slider"));

        // 2. Renderizar cada imagen del slider
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement("div");
            div.className = "slider-thumb";

            div.innerHTML = `
        <img src="${data.url}" alt="${data.nombre || "slider"}" />
        <button onclick="eliminarSlider('${docSnap.id}', '${data.url}')">Eliminar</button>
      `;

            preview.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar slider desde Firestore:", error);
        mostrarMensaje("Error al cargar slider", "error");
    }
}


async function guardarConfiguracion() {
    try {
        // Actualizar objeto config con valores del formulario
        const nombre = document.getElementById("nombre-tienda").value.trim();
        const descripcion = document.getElementById("descripcion-tienda").value.trim();
        const instagram = document.getElementById("link-instagram").value.trim();
        const facebook = document.getElementById("link-facebook").value.trim();
        const whatsapp = document.getElementById("numero-whatsapp").value.trim();
        console.log("Aqui1");

        await setDoc(doc(db, "configuracion", "tienda"), {
            nombre: nombre,
            descripcion: descripcion,
            instagram: instagram,
            facebook: facebook,
            whatsapp: whatsapp,
        });

        mostrarMensaje("Configuración guardada");
    } catch (e) {
        console.error("Error al guardar configuración:", e);
        mostrarMensaje("Error al guardar");
    }
}

// Leer configuración al cargar la página
async function cargarConfiguracion() {
    try {
        renderizarSlider();

        const docSnap = await getDoc(doc(db, "configuracion", "tienda"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("nombre-tienda").value = data.nombre || "";
            document.getElementById("descripcion-tienda").value = data.descripcion || "";
            document.getElementById("link-instagram").value = data.instagram || "";
            document.getElementById("link-facebook").value = data.facebook || "";
            document.getElementById("numero-whatsapp").value = data.whatsapp || "";
        } else {
            console.log("No hay configuración guardada todavía.");
        }
    } catch (e) {
        console.error("Error al leer configuración:", e);
    }
}

window.toggleEdicion = toggleEdicion;
window.eliminarArticulo = eliminarArticulo;
window.eliminarSlider = eliminarSlider;

// Llamar al cargar la página
cargarConfiguracion();

//renderizarAdmin();
