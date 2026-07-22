# 🏗️ Arquitectura del Backend - Kahoot Builder

Este backend está diseñado siguiendo principios de separación de responsabilidades para asegurar un flujo liviano, mantenible y escalable en la recopilación anónima de preguntas y la generación de hojas de cálculo dinámicas.

---

## 🏗️ Capas del Sistema

- **`src/config`**: Gestión de variables de entorno (puertos, orígenes CORS) y constantes globales mediante `dotenv`.
- **`src/controllers`**: Capa HTTP. Recibe las peticiones, valida la entrada (usando Zod) y delega la lógica a los repositorios o servicios. Devuelve la respuesta HTTP o el archivo binario (`.xlsx`).
- **`src/services`**: Capa de negocio y transformación.
  - `excelService.ts`: Orquesta la construcción del libro de trabajo con `exceljs`, mapea las preguntas desde la base de datos al formato tabular oficial de Kahoot y transmite el stream binario.
- **`src/db`**: 
  - `index.ts`: Conexión centralizada a SQLite con `better-sqlite3`.
  - `schema.ts`: Definición única de la estructura de tablas (`questions`, `sessions`).
  - `repositories/`: Abstracción de acceso a datos. Encapsula las queries SQL para guardar preguntas a ciegas y recuperarlas en la exportación sin dispersar código por los controladores.
- **`src/middleware`**: Lógica intermedia como validación de esquemas con Zod, control de CORS y manejo centralizado de errores.
- **`src/routes`**: Definición de los endpoints de la API (`/api/questions`, `/api/export-kahoot`) y su asociación con los controladores y middlewares.
- **`src/types`**: Tipos e interfaces de TypeScript compartidos internamente (`Question`, `KahootExcelRow`, `CreateQuestionDTO`).

---

## 📦 Base de Datos (SQLite)

Se utiliza un esquema relacional ligero mediante `better-sqlite3` con las siguientes entidades principales:
- `sessions`: Registro de la sala o grupo donde los amigos añaden sus preguntas.
- `questions`: Almacena el contenido de las preguntas antes de la exportación:
  - `id`: Identificador único (UUID o autoincremental).
  - `session_id`: Referencia a la sesión del juego.
  - `question`: Texto de la pregunta (máx. 120 caracteres).
  - `option1`, `option2`, `option3`, `option4`: Las 4 opciones de respuesta.
  - `time`: Tiempo en segundos (`5, 10, 20, 30, 60, 90, 120`).
  - `correct`: Índice o índices de respuesta correcta (`1, 2, 3, 4` o `"1,2"`).
  - `created_at`: Timestamp de inserción.

---

## 🔐 Seguridad y Validación

- **Validación estricta**: Uso de `Zod` para asegurar que el contenido de las preguntas y las opciones cumplen con los límites de caracteres y formatos de Kahoot antes de insertarlas en SQLite.
- **CORS Restricted**: Control de origen para aceptar solicitudes únicamente desde el servidor del frontend (`http://localhost:5173`).
- **Generación en Memoria**: `exceljs` procesa las lecturas de la base de datos y genera la descarga `.xlsx` al vuelo sin necesidad de persistir archivos de Excel temporales en disco.

---

## 🧠 Integración Kahoot Engine

El backend consulta el repositorio de SQLite a través del controlador de exportación y procesa la data mediante `excelService.ts` para:
- Mapear la tabla `questions` a la estructura de columnas exigida por Kahoot (*Question, Answer 1-4, Time limit, Correct answer*).
- Transmitir el binario `.xlsx` directamente en la respuesta HTTP usando los encabezados `Content-Disposition` y `Content-Type`.