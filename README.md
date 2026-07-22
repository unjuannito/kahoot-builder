# 🎯 Kahoot Builder

Una aplicación web diseñada para recopilar preguntas de un grupo de amigos de forma anónima ("a ciegas") y exportarlas automáticamente en el formato `.xlsx` oficial para importarlas directamente en **Kahoot**.

---

## 🚀 Características

- 🔒 **Recopilación a ciegas:** Cada participante añade sus preguntas sin ver las del resto.
- 📊 **Exportación instantánea:** Genera una plantilla Excel (`.xlsx`) lista para subir a Kahoot en un solo clic.
- ⚡ **Interfaz rápida:** Construida con React + Vite para máxima fluidez.

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** React, React Router, Vite, Tailwind CSS
- **Backend:** Node.js, Express, ExcelJS, CORS

---

## 🛠️ Instalación y ejecución

El proyecto utiliza **npm** para gestionar dependencias en ambos directorios (frontend y backend).

### Backend
1. Navega al directorio `backend/`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

### Frontend
1. Navega al directorio `frontend/`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

## 📁 Estructura del proyecto

```text
kahoot-builder/
├── backend/          # Servidor Express y generador de Excel
└── frontend/         # App en React (Formulario + Panel de administración)