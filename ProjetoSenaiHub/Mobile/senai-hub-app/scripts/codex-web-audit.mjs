import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    if (process.env.PLAYWRIGHT_REQUIRE_PATH) {
      return require(process.env.PLAYWRIGHT_REQUIRE_PATH);
    }
    throw error;
  }
}

const { chromium } = loadPlaywright();

const BASE_URL = process.env.CODEX_AUDIT_URL ?? 'http://localhost:8093';
const PREFIX = `TESTE-CODEX-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const accounts = [
  { role: 'Admin', email: 'pedro@gmail.com', password: 'senaisp' },
  { role: 'Aluno', email: 'p2@aluno.edu.br', password: 'senaisp' },
  { role: 'Professor', email: 'samu@senai.br', password: 'senaisp' },
];

const routes = [
  '/',
  '/login',
  '/hub',
  '/perfil',
  '/grid',
  '/grid/chamados',
  '/grid/tarefas',
  '/grid/relatorios',
  '/grid/estoque',
  '/grid/usuarios',
  '/connect',
  '/connect/alunos',
  '/connect/professores',
  '/connect/usuarios',
  '/connect/turmas',
  '/connect/cursos',
  '/connect/empresas',
  '/connect/frequencia',
  '/connect/gerenciar-frequencia',
  '/connect/relatorios',
  '/connect/localizacao',
  '/connect/contratos',
  '/connect/contrato-alunos',
  '/connect/salario',
  '/aluno/dashboard',
  '/aluno/frequencia',
  '/aluno/grade',
  '/aluno/perfil',
];

const crudPlans = [
  {
    route: '/grid/chamados',
    newButton: /abrir chamado|novo chamado|\+ abrir chamado/i,
    createValues: {
      titulo: `${PREFIX} Chamado`,
      descricao: `${PREFIX} descricao do chamado`,
    },
    searchText: `${PREFIX} Chamado`,
  },
  {
    route: '/grid/estoque',
    newButton: /adicionar item|novo item|\+ novo item|novo/i,
    createValues: {
      titulo: `${PREFIX} Item`,
      descricao: `${PREFIX} item estoque`,
      quantidade_disponivel: '7',
      quantidade_minima: '2',
      unidade: 'un',
      localizacao: 'TESTE',
      custo: '10',
    },
    searchText: `${PREFIX} Item`,
  },
  {
    route: '/connect/cursos',
    newButton: /novo curso|\+ novo curso|novo/i,
    createValues: {
      nome: `${PREFIX} Curso`,
      descricao: `${PREFIX} curso teste`,
      carga_horaria: '40',
    },
    searchText: `${PREFIX} Curso`,
  },
  {
    route: '/connect/empresas',
    newButton: /nova empresa|\+ nova empresa|novo/i,
    createValues: {
      nome: `${PREFIX} Empresa`,
      cnpj: '12.345.678/0001-90',
      email: `empresa.${Date.now()}@teste-codex.com`,
      telefone: '(19) 99999-9999',
      responsavel: 'TESTE CODEX',
      senha_acesso: 'senaisp',
      confirmar_senha: 'senaisp',
    },
    searchText: `${PREFIX} Empresa`,
  },
];

const issues = [];
const steps = [];

function logStep(step, status, detail = '') {
  steps.push({ step, status, detail, at: new Date().toISOString() });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

function addIssue(type, context, message, extra = {}) {
  issues.push({ type, context, message, extra, at: new Date().toISOString() });
  console.log(`[ISSUE:${type}] ${context} - ${message}`);
}

function sanitize(text = '') {
  return text.replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function attachObservers(page, contextName) {
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      addIssue(`console.${msg.type()}`, contextName, sanitize(msg.text()));
    }
  });
  page.on('pageerror', (error) => {
    addIssue('pageerror', contextName, error.message);
  });
  page.on('requestfailed', (request) => {
    addIssue('requestfailed', contextName, `${request.method()} ${request.url()}`, {
      failure: request.failure()?.errorText,
    });
  });
  page.on('response', async (response) => {
    const status = response.status();
    if (status >= 400) {
      addIssue('http', contextName, `${status} ${response.request().method()} ${response.url()}`);
    }
  });
}

async function safeGoto(page, route, contextName) {
  const url = route.startsWith('http') ? route : `${BASE_URL}${route}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);
    const title = sanitize(await page.locator('body').innerText({ timeout: 10000 }).catch(() => ''));
    logStep(`${contextName} abrir ${route}`, 'ok', title.slice(0, 120));
    return true;
  } catch (error) {
    addIssue('navigation', contextName, `Falha ao abrir ${route}: ${error.message}`);
    return false;
  }
}

async function fillLogin(page, account) {
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (count < 2) throw new Error(`Tela de login nao possui 2 inputs; encontrados ${count}`);
  await inputs.nth(0).fill(account.email);
  await inputs.nth(1).fill(account.password);
  const loginButton = page.getByText(/entrar/i).last();
  await loginButton.click({ timeout: 15000 });
  await page.waitForTimeout(5000);
}

async function login(page, account) {
  await safeGoto(page, '/login', `${account.role} login`);
  await fillLogin(page, account);
  const body = sanitize(await page.locator('body').innerText({ timeout: 15000 }).catch(() => ''));
  if (/erro|inv[aá]lid|não encontrado|nao encontrado|senha|perfil não/i.test(body) && !/hub|senai|connect|grid/i.test(body)) {
    addIssue('login', account.role, `Possivel falha de login: ${body}`);
    return false;
  }
  logStep(`Login ${account.role}`, 'ok', body.slice(0, 140));
  return true;
}

async function logout(page, contextName) {
  await safeGoto(page, '/perfil', contextName);
  const sair = page.getByText(/sair|deslogar|logout/i).last();
  if (await sair.count()) {
    await sair.click().catch(() => undefined);
    await page.waitForTimeout(2000);
  }
}

async function fillLikelyForm(page, values) {
  const inputs = page.locator('input, textarea');
  const total = await inputs.count();
  const used = new Set();

  for (const [key, value] of Object.entries(values)) {
    const keyRegex = new RegExp(key.replace(/_/g, '.{0,12}'), 'i');
    let filled = false;
    for (let i = 0; i < total; i += 1) {
      if (used.has(i)) continue;
      const input = inputs.nth(i);
      const attrs = [
        await input.getAttribute('name').catch(() => ''),
        await input.getAttribute('placeholder').catch(() => ''),
        await input.getAttribute('aria-label').catch(() => ''),
        await input.getAttribute('type').catch(() => ''),
      ].join(' ');
      if (keyRegex.test(attrs)) {
        await input.fill(String(value)).catch(() => undefined);
        used.add(i);
        filled = true;
        break;
      }
    }
  }
}

async function clickText(page, regex, timeout = 10000, position = 'first') {
  const matches = page.getByText(regex);
  const locator = position === 'last' ? matches.last() : matches.first();
  await locator.click({ timeout });
}

async function exerciseCrud(page, plan) {
  const contextName = `CRUD ${plan.route}`;
  const opened = await safeGoto(page, plan.route, contextName);
  if (!opened) return;

  try {
    await clickText(page, plan.newButton, 12000);
    await page.waitForTimeout(1000);
  } catch (error) {
    addIssue('crud.create.open', contextName, `Nao abriu modal de criacao: ${error.message}`);
    return;
  }

  try {
    await fillLikelyForm(page, plan.createValues);
    await clickText(page, /criar|salvar|abrir|cadastrar/i, 12000, 'last');
    await page.waitForTimeout(5000);
  } catch (error) {
    addIssue('crud.create.submit', contextName, `Falha ao enviar criacao: ${error.message}`);
    return;
  }

  const bodyAfterCreate = sanitize(await page.locator('body').innerText().catch(() => ''));
  if (!bodyAfterCreate.includes(plan.searchText)) {
    addIssue('crud.create.verify', contextName, `Registro criado nao apareceu na tela. Texto buscado: ${plan.searchText}`, {
      body: bodyAfterCreate.slice(0, 500),
    });
  } else {
    logStep(`Criar ${plan.route}`, 'ok', plan.searchText);
  }

  const row = page.getByText(plan.searchText).first();
  if (!(await row.count())) return;

  try {
    const editByLabel = page.getByLabel(/editar/i).first();
    const editButton = (await editByLabel.count())
      ? editByLabel
      : page.locator('button').filter({ hasText: /editar/i }).first();
    if (await editButton.count()) {
      await editButton.click();
    } else {
      await row.click();
    }
    await page.waitForTimeout(1000);
    await fillLikelyForm(page, { descricao: `${PREFIX} editado` });
    await clickText(page, /salvar/i, 8000, 'last');
    await page.waitForTimeout(3000);
    logStep(`Editar ${plan.route}`, 'ok');
  } catch (error) {
    addIssue('crud.update', contextName, `Nao consegui editar pelo fluxo visual: ${error.message}`);
  }

  try {
    await page.keyboard.press('Escape').catch(() => undefined);
    const deleteByLabel = page.getByLabel(/excluir|delete/i).first();
    const deleteButton = (await deleteByLabel.count())
      ? deleteByLabel
      : page.locator('button').filter({ hasText: /excluir|delete/i }).first();
    if (await deleteButton.count()) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      await clickText(page, /excluir|confirmar|sim/i, 8000, 'last');
      await page.waitForTimeout(3000);
      logStep(`Excluir ${plan.route}`, 'ok');
    } else {
      addIssue('crud.delete.button', contextName, 'Nao encontrei botao de excluir com texto acessivel.');
    }
  } catch (error) {
    addIssue('crud.delete', contextName, `Nao consegui excluir pelo fluxo visual: ${error.message}`);
  }
}

async function auditAccount(browser, account) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await attachObservers(page, account.role);

  const ok = await login(page, account);
  if (!ok) {
    await context.close();
    return;
  }

  for (const route of routes) {
    await safeGoto(page, route, account.role);
  }

  if (account.role === 'Admin') {
    for (const plan of crudPlans) {
      await exerciseCrud(page, plan);
    }
  }

  await logout(page, account.role);
  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  });

  try {
    for (const account of accounts) {
      await auditAccount(browser, account);
    }
  } finally {
    await browser.close();
  }

  const report = {
    baseUrl: BASE_URL,
    prefix: PREFIX,
    generatedAt: new Date().toISOString(),
    steps,
    issues,
  };

  const outDir = path.resolve('codex-audit-output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'web-audit-report.json'), JSON.stringify(report, null, 2));

  const md = [
    '# Relatorio de Auditoria Web',
    '',
    `Base URL: ${BASE_URL}`,
    `Prefixo de teste: ${PREFIX}`,
    `Gerado em: ${report.generatedAt}`,
    '',
    '## Erros Encontrados',
    issues.length
      ? issues.map((issue, index) => `${index + 1}. **${issue.type}** em ${issue.context}: ${issue.message}`).join('\n')
      : 'Nenhum erro capturado.',
    '',
    '## Passos Executados',
    steps.map((step, index) => `${index + 1}. [${step.status}] ${step.step}${step.detail ? ` - ${step.detail}` : ''}`).join('\n'),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'web-audit-report.md'), md);
}

main().catch((error) => {
  addIssue('fatal', 'audit', error.stack || error.message);
  const outDir = path.resolve('codex-audit-output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'web-audit-report.json'),
    JSON.stringify({ baseUrl: BASE_URL, prefix: PREFIX, steps, issues }, null, 2)
  );
  process.exitCode = 1;
});
