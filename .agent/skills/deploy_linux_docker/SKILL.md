# Skill: deploy_linux_docker

Esta skill permite configurar rápidamente un pipeline de despliegue continuo (CI/CD) usando GitHub Actions, Docker y Docker Compose para proyectos Fullstack (Node.js + React/Vite) en servidores Linux.

## Requisitos
- Repositorio en GitHub.
- Servidor Linux con Docker y Docker Compose instalados.
- Secrets configurados en el repositorio de GitHub:
    - `SERVER_IP`: IP del servidor.
    - `SERVER_USER`: Usuario SSH.
    - `SSH_PRIVATE_KEY`: Clave privada SSH.

## Instrucciones de Uso
1. Copia el archivo `deploy_config.json.example` a la raíz de tu proyecto y cámbiale el nombre a `deploy_config.json`.
2. Ajusta los valores en `deploy_config.json` según tu proyecto.
3. Ejecuta el comando:
   `node .agent/skills/deploy_linux_docker/scripts/apply_deploy.js`
4. La skill generará los siguientes archivos:
    - `.github/workflows/deploy.yml`
    - `docker-compose.yml`
    - `back/Dockerfile.back`
    - `back/entrypoint.sh`
    - `front/Dockerfile.front`
    - `front/env.sh`

## Estructura de Parámetros
El archivo `deploy_config.json` debe contener:
- `projectName`: Nombre del proyecto (Slug).
- `repoName`: Nombre del repo en GitHub (org/repo).
- `branch`: Rama que dispara el despliegue (ej: `main`).
- `serverPath`: Ruta absoluta en el servidor donde residirá el proyecto.
- `ports`: Puertos externos para DB, API y Frontend.
- `containerNames`: Nombres de los contenedores para evitar colisiones.
