import '../styles/login.css';
// Importa Firebase
import { auth } from "../util/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Crear el proveedor de Google
const provider = new GoogleAuthProvider();

const btnLoginGoogle = document.getElementById("btn-google-login");

btnLoginGoogle.onclick = function () {
    loginWithGoogle();
}

async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        // Usuario autenticado
        const user = result.user;
        window.location.href = "./admin.html";
        console.log("Usuario logueado con Google:", user.displayName, user.email);
    } catch (error) {
        console.error("Error en login con Google:", error.message);
    }
}

