# ⚽ CAZA – Plataforma de Simulación & Mercado de Fútbol 🎮

Bienvenido a **CAZA**, la plataforma digital interactiva diseñada por y para apasionados del fútbol y de los videojuegos **FIFA** y **eFootball**.

---

## 🎬 Demostración en Video (Video Demo)

A continuación puedes ver la demostración interactiva en video sobre el funcionamiento completo de la plataforma **CAZA**:

<div align="center">
  <video src="https://github.com/FRANCO2022015/CAZA-FIFA/blob/main/Caza3.mp4?raw=true" controls="controls" width="100%" style="max-width: 850px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></video>
</div>

---

## 🌟 ¿Qué es CAZA?

**CAZA** convierte al usuario en el **Presidente, Director Deportivo y Entrenador de su propio club**, permitiéndole explorar futbolistas, analizar métricas de rendimiento, realizar fichajes en un mercado interactivo y diseñar alineaciones tácticas profesionales.

---

## 💎 El Gran Valor Añadido: Una Base de Datos Creada desde la Experiencia Real

A diferencia de cualquier otra plataforma con datos genéricos o aleatorios, la base de datos de **CAZA** posee un valor único e incomparable: **es el fruto de mis 4 años de trayectoria y seguimiento estadístico real dentro del juego, es decir, son los datos que recopilé en todo este tiempo que he llevado jugando estos videojuegos**.

Cada uno de los más de 400 futbolistas presentes en la plataforma y todas sus métricas (goles, asistencias, partidos y promedios) provienen de mi registro histórico obtenido a lo largo de 4 años de juego.

* ⚽ **En FIFA:** Datos recopilados a través de múltiples temporadas en el *Modo Carrera como Director Técnico (DT)*.
* 🎮 **En eFootball:** Estadísticas de rendimiento compitiendo en el exigente modo de *Divisiones*.

De esta forma, **CAZA** no solo presenta números: refleja la verdadera eficacia, rendimiento y comportamiento de cada jugador en la cancha virtual bajo mi dirección a lo largo de los años.

---

## 💻 Guía de Instalación y Ejecución Local

Para ejecutar este proyecto en tu computadora local, sigue estos pasos:

### 📋 Requisitos Previos
* **Node.js** (Versión 18 o superior)
* **Java JDK** (Versión 21)
* **Maven** (o usa el Wrapper de Maven en el proyecto)
* **PostgreSQL** (base de datos con nombre `caza_db`, usuario `caza_user` y contraseña `caza_pass`)

---

### 1️⃣ Ejecutar el Backend (Spring Boot)

1. Abre una terminal y navega hasta la carpeta del backend:
   ```bash
   cd caza-backend
   ```
2. Asegúrate de tener tu servidor PostgreSQL corriendo con la base de datos `caza_db` creada.
3. Compila e inicia el servidor Backend:
   ```bash
   ./mvnw spring-boot:run
   ```

El servidor backend estará escuchando en `http://localhost:8080`. Se ejecutarán las migraciones e inicializaciones automáticas (creando las tablas y la cuenta de administrador inicial).

---

### 2️⃣ Ejecutar el Frontend (React + Vite)

1. Abre una nueva ventana de terminal y navega a la carpeta del frontend:
   ```bash
   cd caza-frontend
   ```
2. Instala las dependencias necesarias de Node:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Abre tu navegador e ingresa a la dirección indicada por Vite: `http://localhost:5173`.

---

## 🕹️ Guía de Uso e Interacción con la Aplicación

### 🔑 1. Registro e Inicio de Sesión
* **Crear Cuenta:** Si eres un usuario nuevo, haz clic en **"Registrarse"**, ingresa tu nombre, correo electrónico y contraseña. Al registrarte recibirás automáticamente un **saldo inicial de $10,000** para tus contrataciones.
* **Iniciar Sesión:** Ingresa tu correo y contraseña registrados para acceder a tu panel de usuario.
* **Acceso de Administrador:** En el pie de página o visitando `/admin/login`, puedes acceder como Administrador.

---

### 🔍 2. Exploración y Filtro de Jugadores (Sección Jugadores)
* **Navega por pestañas:** Cambia fácilmente entre el catálogo de **⚽ FIFA** y **🎮 eFootball**.
* **Buscador:** Escribe el nombre de cualquier jugador en la barra superior para ubicarlo de inmediato.
* **Filtros por Ordenamiento:** Haz clic en las etiquetas de la parte superior para ordenar de menor a mayor (o viceversa) por **Nombre, Goles Totales, Asistencias Totales, Edad, Precio o Nacionalidad** (en FIFA) o por **Goles, Asistencias, Partidos, PG, PA y PGA** (en eFootball).
* **Filtros Avanzados (eFootball):** Activa el panel de *"Filtros Avanzados"* para ingresar rangos numéricos exactos (ej. Jugadores con más de 100 goles o PG > 0.5). El sistema filtrará la lista y ajustará las páginas mostrando **únicamente** a los futbolistas que cumplan todos los requisitos.

---

### 📝 3. Ficha y Edición de Jugadores
* **Ver Estadísticas:** Haz clic en el botón **"Ver"** de cualquier tarjeta de jugador para ver sus desglose de temporadas, fotos e historial.
* **Actualizar Fotos / Estadísticas:** Si eres el dueño o Administrador, puedes actualizar las estadísticas por temporada de los jugadores o cambiar su foto oficial en la web.

---

### 🛒 4. Mercado de Fichajes y Gestión de Saldo
* **Añadir al Carrito:** Haz clic en **"Carrito"** en cualquier jugador disponible para sumarlo a tu lista de transferencias.
* **Comprar / Checkout:** Ve a la pestaña **Carrito**, revisa el monto total y confirma la transferencia si cuentas con saldo suficiente.
* **Solicitar Saldo:** Si tu saldo se agota, ve a tu perfil / dashboard y presiona **"Solicitar Saldo"**. El administrador revisará tu petición desde el panel de control `/admin` y al ser aprobada recibirás un aviso emergente en tiempo real.
* **Mis Compras:** En esta sección podrás ver todo tu historial de contrataciones.

---

### ⚔️ 5. Armar Equipo (Laboratorio Táctico)
* **Pizarra Táctica:** Entra a la sección **"Armar Equipo"** para visualizar el campo de juego en 3D.
* **Elegir Formación:** Selecciona entre 13 estrategias tácticas (4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-4-1, 4-3-2-1, 5-2-3, 4-1-4-1, 4-2-4, 4-5-1, etc.).
* **Asignar Jugadores:** Haz clic sobre cualquier casilla `(+)` en el campo para buscar y posicionar al jugador ideal en cada demarcación.
* **Modos de Juego:**
  * **Mi Equipo:** Utiliza solo los futbolistas que has fichado previamente en el Mercado.
  * **Equipo Potencial:** Prueba alineaciones de ensueño usando a cualquier futbolista disponible en la plataforma.
* **Guardar en Favoritos:** Presiona el botón **"⭐ Guardar en Favoritos"**, asígnale un nombre a tu plantilla táctica (ej: *"Mi 11 Titular FIFA"*) y guárdala para cargarla o restaurarla cuando quieras.

---

## 🔑 Credenciales de Acceso por Defecto

### 🛡️ Administrador
* **Correo:** `admin@caza.com`
* **Contraseña:** `Admin2024!`

---

## 🏆 Conclusión

> *"CAZA es la síntesis perfecta entre el análisis de datos futbolísticos y mi pasión del gaming. Al alimentar la plataforma con 4 años de datos reales cosechados en el Modo Carrera de FIFA y las Divisiones de eFootball, el proyecto ofrece una herramienta inmersiva, auténtica y con un valor sentimental y técnico incomparable para cualquier apasionado de la simulación futbolística, especialmente para mí."*
