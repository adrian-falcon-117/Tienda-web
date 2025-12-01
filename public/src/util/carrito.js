// Agregar al carrito y restar stock en Firestore
let carrito = [];

export async function agregarAlCarrito(id, articulos) {
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
export function renderizarCarrito() {
    carritoLista.innerHTML = "";
    let total = 0;
    carrito.forEach((a) => {
        carritoLista.innerHTML += `<li>${a.titulo} x${a.cantidad || 1} - $${a.precio * (a.cantidad || 1)}</li>`;
        total += a.precio * (a.cantidad || 1);
    });
    carritoTotal.textContent = total;
}

// 🔹 Mostrar carrito (igual que antes)
export function mostrarCarrito() {
    const carrito = document.getElementById("carrito");
    carrito.classList.toggle("oculto");
    if (!carrito.classList.contains("oculto")) {
        carrito.classList.add("animar-carrito");
        setTimeout(() => carrito.classList.remove("animar-carrito"), 500);
    }
}

// 🔹 Vaciar carrito y reintegrar stock en Firestore
export async function vaciarCarrito() {
    carrito = [];
    carritoCount.textContent = 0;
    renderizarCarrito();
}