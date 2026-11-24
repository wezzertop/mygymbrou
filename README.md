# MiGymBrou — Plataforma SaaS Mobile-First para Coaches y Alumnos Fitness

Aplicación Web Progresiva (PWA) construida con **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **Recharts** y **Supabase** (Auth, PostgreSQL, RLS, Storage), lista para despliegue en **Docker / Dokploy**.

## Características Principales

- **Landing Page Pública (`/`)**: Estética deportiva Dark UI con CTAs para Coaches y Alumnos, vista previa móvil, planes y acceso directo a **Modo Demo Interactivo**.
- **Autenticación y Roles (`/auth/*`)**:
  - Acceso diferenciado Coach vs. Alumno (`/auth`).
  - Registro de Coach (`/auth/register-coach`) con aceptación obligatoria de Términos y Condiciones (timestamp guardado) y confirmación de correo.
  - Invitación de Alumnos por correo desde el Panel del Coach + Activación de Cuenta (`/auth/activate`).
  - Recuperación y restablecimiento de contraseña (`/auth/forgot-password`, `/auth/reset-password`).
- **Panel del Coach (`/coach/*`)**: Dashboard con KPIs y FAB, gestión de alumnos con filtros, Expediente 360° (antropometría con comparativa automática y gráficas, rutina, dieta y suscripción), constructor de plantillas reutilizables y agenda de citas.
- **App del Alumno (`/student/*`)**: Barra de navegación inferior fija de 5 accesos (**Avances**, **Rutinas**, **Dieta**, **Citas**, **Suscripción**) + header fijo con **Notificaciones** y **Perfil**, temporizador de descanso integrado y banner publicitario modular no invasivo (`<NonIntrusiveAdBanner />`).

## Ejecución en Local con pnpm

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta el archivo `supabase/schema.sql` completo en el **SQL Editor** de Supabase.
3. Copia `.env.example` a `.env.local` y configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

## Despliegue en Dokploy

El proyecto incluye `Dockerfile` multi-stage con `output: "standalone"` optimizado para **pnpm**. Solo conecta tu repositorio en Dokploy, configura las variables de `.env.example` y despliega en el puerto `3000`.
