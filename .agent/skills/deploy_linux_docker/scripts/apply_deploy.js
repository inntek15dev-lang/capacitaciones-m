const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'deploy_config.json');

if (!fs.existsSync(configPath)) {
  console.error('❌ Error: No se encontró deploy_config.json en la raíz del proyecto.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const templatesDir = path.join(__dirname, '..', 'templates');

const placeholders = {
  '{{PROJECT_NAME}}': config.projectName,
  '{{REPO_NAME}}': config.repoName,
  '{{BRANCH}}': config.branch,
  '{{SERVER_PATH}}': config.serverPath,
  '{{CONTAINER_NAME_DB}}': config.db.containerName,
  '{{CONTAINER_NAME_API}}': config.api.containerName,
  '{{CONTAINER_NAME_FRONT}}': config.front.containerName,
  '{{PORT_DB_EXT}}': config.db.portExt,
  '{{PORT_API_EXT}}': config.api.portExt,
  '{{PORT_API_INT}}': config.api.portInt,
  '{{PORT_FRONT_EXT}}': config.front.portExt,
  '{{DOMAIN_API}}': config.api.domain,
  '{{DB_NAME}}': config.db.name,
  '{{NETWORK_NAME}}': config.networkName,
  '{{API_URL}}': config.front.apiUrl
};

function replacePlaceholders(content) {
  let result = content;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.split(key).join(value);
  }
  return result;
}

const filesToGenerate = [
  { template: 'deploy.yml.template', target: '.github/workflows/deploy.yml' },
  { template: 'docker-compose.yml.template', target: 'docker-compose.yml' },
  { template: 'Dockerfile.back.template', target: 'back/Dockerfile.back' },
  { template: 'entrypoint.sh.template', target: 'back/entrypoint.sh' },
  { template: 'Dockerfile.front.template', target: 'front/Dockerfile.front' },
  { template: 'env.sh.template', target: 'front/env.sh' }
];

filesToGenerate.forEach(file => {
  const templatePath = path.join(templatesDir, file.template);
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Advertencia: No se encontró la plantilla ${file.template}`);
    return;
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  const replacedContent = replacePlaceholders(content);
  const targetPath = path.join(process.cwd(), file.target);
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, replacedContent);
  console.log(`✅ Generado: ${file.target}`);
});

console.log('\n✨ Despliegue configurado con éxito. Revisa los archivos generados.');
