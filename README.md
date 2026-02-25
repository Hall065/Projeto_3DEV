🏢 Projeto3DEVT – Manutenção Predial
<p align="center"> <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="Logo Senai"/></p>

<h1>📌 Sobre o Projeto</h1>

<p>O Projeto3DEVT – Manutenção Predial é uma aplicação desenvolvida para atender às demandas de gestão de manutenção predial do SENAI, oferecendo maior transparência, organização e eficiência no controle de chamados técnicos.</p>

<p>A proposta consiste na criação do Back-End da plataforma PredialFix, responsável por: </p>

<ul>
    <li>Gerenciar solicitações de manutenção</li>
    <li>Acompanhar o fluxo de atendimento</li>
    <li>Fornecer histórico completo das intervenções realizadas</li>
</ul>

<p>Problemas que o sistema busca resolver: </p>

<ul>
    <li>Falta de transparência no andamento dos chamados</li>
    <li>Demora no atendimento</li>
    <li>Dificuldade na organização das demandas mensais</li>
    <li>Ausência de histórico estruturado por unidade</li> 
</ul>

<h1>Equipe de Desenvolvimento</h1>

<ul>
    <li>João Vitor Francisco</li>
    <li>Integrante 2</li>
    <li>Integrante 3</li>
</ul>

<p>
    <strong>Disciplina:</strong> Desenvolvimento Back-End
    <strong>Entrega:</strong> Por Sprints
    <strong>Repositório:</strong> Público para avaliação via GitHub
</p>

<h1>Objetivo do Sistema</h1>

<p>Desenvolver uma API RESTful robusta para gerenciamento de chamados de manutenção predial, contemplando: </p>

<ul>
    <li>Controle de usuários multi-nível</li>
    <li>Registro estruturado de problemas</li>
    <li>Workflow completo de atendimento</li>
    <li>Histórico por unidade</li>
    <li>Sistema de notificações simuladas</li>
</ul>

<h1>Arquitetura do Projeto</h1>

<p>🔹 Back-End</p>

<ul>
    <li>Laravel (PHP)</li>
    <li>API RESTful</li>
    <li>Eloquent ORM</li>
    <li>Validação via Form Requests</li>
    <li>Autenticação multi-nível</li>
</ul>

<p>🔹 Front-End</p>

<ul>
    <li>Vue.js</li>
    <li>Interface para abertura e acompanhamento de chamados</li>
    <li>Consumo da API via JSON</li>
</ul>

<p>🔹 Banco de Dados</p>

<ul>
    <li>MySQL</li>
    <li>Modelagem relacional</li>
    <li>Estrutura normalizada para usuários, chamados e histórico</li>
</ul>

<h1>Funcionalidades Essenciais</h1>

<h3>1 - Gestão de Usuários (Multi-nível)</h3>

<ul>
    <li>Usuários comuns → abrem chamados</li>
    <li>Responsáveis técnicos → atualizam status e gerenciam atendimento</li>
</ul>

<h3>2 - Abertura de Chamados</h3>

<p>Registro contendo: </p>

<ul>
    <li>Tipo (Elétrica / Hidráulica / Outros)</li>
    <li>Descrição</li>
    <li>Localização</li>
    <li>Data de abertura</li>
</ul>

<h3>3 - Workflow de Atendimento</h3>

<pre> Aberto → Em Análise → Em Execução → Concluído </pre>

<h3>4 - Histórico da Unidade</h3>

<p>Consulta de serviços realizados por: </p>

<ul>
    <li>Sala</li>
    <li>Bloco</li>
    <li>Área comum</li>
</ul>

<h3>Notificações de Progresso (Simulado)</h3>

<ul>
    <li>"Técnico a caminho"</li>
    <li>"Serviço em execução"</li>
    <li>"Chamado finalizado"</li>
</ul>

<h1>📂 Estrutura Base do Projeto</h1>

<pre>
Projeto3DEVT/
│
├── app/
│   ├── Models/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│
├── database/
│   ├── migrations/
│   ├── seeders/
│
├── routes/
│   ├── api.php
│
├── resources/
│   ├── js/ (Vue)
│   ├── views/
│
└── README.md
</pre>

<em>Esta estrutura será expandida conforme o avanço das sprints.</em>


<h1>Requisitos Técnicos</h1>

<ul>
    <li>Back-End em Laravel</li>
    <li>Banco de dados relacional</li>
    <li>API RESTful com respostas JSON</li>
    <li>Validação rigorosa de dados</li>
    <li>Documentação clara dos endpoints</li>
</ul>

<h2>📡 Endpoints da API (Estrutura Inicial)</h2>

<em>Será detalhado conforme desenvolvimento das sprints.</em>

<p>🔹 Usuários</p>

<ul>
    <li>POST /api/register</li>
    <li>POST /api/login</li>
</ul>

<p>🔹 Chamados</p>

<ul>
    <li>GET /api/chamados</li>
    <li>POST /api/chamados</li>
    <li>PUT /api/chamados/{id}</li>
    <li>GET /api/unidades/{id}/historico</li>
</ul>

<h2>📊 Organização por Sprints</h2>

<ul>
    <li><strong>Sprint 1:</strong> Estrutura base da API + Autenticação</li>
    <li><strong>Sprint 2:</strong> CRUD de Chamados + Workflow</li>
    <li><strong>Sprint 3:</strong> Histórico por Unidade + Notificações</li>
    <li><strong>Sprint 4:</strong> Integração completa com Vue + Ajustes finais</li>
</ul>

<em>Cronograma sujeito a ajustes conforme orientação do professor.</em>

<h2>📄 Documentação da API</h2>

<p>A documentação completa dos endpoints será adicionada conforme evolução do projeto.</p>

<h2>Planejamento:</h2>

<ul>
    <li>Padronização REST</li>
    <li>Respostas estruturadas</li>
    <li>Tratamento de erros</li>
    <li>Códigos HTTP adequados</li>
</ul>

<h3>📌 Status do Projeto</h3>

<p>🚧 Em desenvolvimento (Modelo por Sprints)</p>