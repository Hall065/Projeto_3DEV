🏢 Projeto3DEVT – Manutenção Predial
<p align="center"> <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="Logo Senai" width="200"/> </p>
📌 Sobre o Projeto

O Projeto3DEVT – Manutenção Predial é uma aplicação desenvolvida para atender às demandas de gestão de manutenção predial do SENAI, oferecendo maior transparência, organização e eficiência no controle de chamados técnicos.

A proposta consiste na criação do Back-End da plataforma PredialFix, responsável por:

<ul> <li>Gerenciar solicitações de manutenção</li> <li>Acompanhar o fluxo de atendimento</li> <li>Fornecer histórico completo das intervenções realizadas</li> </ul>
Problemas que o sistema busca resolver:
<ul> <li>Falta de transparência no andamento dos chamados</li> <li>Demora no atendimento</li> <li>Dificuldade na organização das demandas mensais</li> <li>Ausência de histórico estruturado por unidade</li> </ul>
👨‍💻 Equipe de Desenvolvimento
<ul> <li>João Vitor Francisco</li> <li>Integrante 2</li> <li>Integrante 3</li> </ul>

<strong>Disciplina:</strong> Desenvolvimento Back-End
<strong>Entrega:</strong> Por Sprints
<strong>Repositório:</strong> Público para avaliação via GitHub

🎯 Objetivo do Sistema

Desenvolver uma API RESTful robusta para gerenciamento de chamados de manutenção predial, contemplando:

<ul> <li>Controle de usuários multi-nível</li> <li>Registro estruturado de problemas</li> <li>Workflow completo de atendimento</li> <li>Histórico por unidade</li> <li>Sistema de notificações simuladas</li> </ul>
🧱 Arquitetura do Projeto
🔹 Back-End
<ul> <li>Laravel (PHP)</li> <li>API RESTful</li> <li>Eloquent ORM</li> <li>Validação via Form Requests</li> <li>Autenticação multi-nível</li> </ul>
🔹 Front-End
<ul> <li>Vue.js</li> <li>Interface para abertura e acompanhamento de chamados</li> <li>Consumo da API via JSON</li> </ul>
🔹 Banco de Dados
<ul> <li>MySQL</li> <li>Modelagem relacional</li> <li>Estrutura normalizada para usuários, chamados e histórico</li> </ul>
🚀 Funcionalidades Essenciais
1️⃣ Gestão de Usuários (Multi-nível)
<ul> <li>Usuários comuns → abrem chamados</li> <li>Responsáveis técnicos → atualizam status e gerenciam atendimento</li> </ul>
2️⃣ Abertura de Chamados

Registro contendo:

<ul> <li>Tipo (Elétrica / Hidráulica / Outros)</li> <li>Descrição</li> <li>Localização</li> <li>Data de abertura</li> </ul>
3️⃣ Workflow de Atendimento
<pre> Aberto → Em Análise → Em Execução → Concluído </pre>
4️⃣ Histórico da Unidade

Consulta de serviços realizados por:

<ul> <li>Sala</li> <li>Bloco</li> <li>Área comum</li> </ul>
5️⃣ Notificações de Progresso (Simulado)
<ul> <li>"Técnico a caminho"</li> <li>"Serviço em execução"</li> <li>"Chamado finalizado"</li> </ul>
📂 Estrutura Base do Projeto
<pre> Projeto3DEVT/ │ ├── app/ │ ├── Models/ │ ├── Http/ │ │ ├── Controllers/ │ │ ├── Requests/ │ ├── database/ │ ├── migrations/ │ ├── seeders/ │ ├── routes/ │ ├── api.php │ ├── resources/ │ ├── js/ (Vue) │ ├── views/ │ └── README.md </pre>

<em>Esta estrutura será expandida conforme o avanço das sprints.</em>

🔐 Requisitos Técnicos
<ul> <li>Back-End em Laravel</li> <li>Banco de dados relacional</li> <li>API RESTful com respostas JSON</li> <li>Validação rigorosa de dados</li> <li>Documentação clara dos endpoints</li> </ul>
📡 Endpoints da API (Estrutura Inicial)

<em>Será detalhado conforme desenvolvimento das sprints.</em>

🔹 Usuários
<ul> <li>POST /api/register</li> <li>POST /api/login</li> </ul>
🔹 Chamados
<ul> <li>GET /api/chamados</li> <li>POST /api/chamados</li> <li>PUT /api/chamados/{id}</li> <li>GET /api/unidades/{id}/historico</li> </ul>
📊 Organização por Sprints
<ul> <li><strong>Sprint 1:</strong> Estrutura base da API + Autenticação</li> <li><strong>Sprint 2:</strong> CRUD de Chamados + Workflow</li> <li><strong>Sprint 3:</strong> Histórico por Unidade + Notificações</li> <li><strong>Sprint 4:</strong> Integração completa com Vue + Ajustes finais</li> </ul>

<em>Cronograma sujeito a ajustes conforme orientação do professor.</em>

📄 Documentação da API

A documentação completa dos endpoints será adicionada conforme evolução do projeto.

Planejamento:

<ul> <li>Padronização REST</li> <li>Respostas estruturadas</li> <li>Tratamento de erros</li> <li>Códigos HTTP adequados</li> </ul>
📌 Status do Projeto

🚧 Em desenvolvimento (Modelo por Sprints)