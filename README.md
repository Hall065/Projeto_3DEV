🏢 Projeto3DEVT – Manutenção Predial

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="Logo Senai"/>
</p>

📌 Sobre o Projeto

O Projeto3DEVT – Manutenção Predial é uma aplicação desenvolvida para atender às demandas de gestão de manutenção predial do SENAI, oferecendo maior transparência, organização e eficiência no controle de chamados técnicos.

A proposta consiste na criação do Back-End da plataforma PredialFix, responsável por gerenciar solicitações de manutenção, acompanhar o fluxo de atendimento e fornecer histórico completo das intervenções realizadas.

O sistema busca resolver problemas como:

Falta de transparência no andamento dos chamados

Demora no atendimento

Dificuldade na organização das demandas mensais

Ausência de histórico estruturado por unidade

<hr>

👨‍💻 Equipe de Desenvolvimento

Projeto desenvolvido por:

João Vitor Francisco

Integrante 2

Integrante 3

Disciplina: Desenvolvimento Back-End
Entrega: Por Sprints
Repositório público para avaliação via GitHub

<hr>

🎯 Objetivo do Sistema

Criar uma API RESTful robusta para gerenciamento de chamados de manutenção predial, com:

Controle de usuários multi-nível

Registro estruturado de problemas

Workflow completo de atendimento

Histórico por unidade

Sistema de notificações simuladas

<hr>

🧱 Arquitetura do Projeto

O projeto é dividido em:

🔹 Back-End

Laravel (PHP)

API RESTful

Eloquent ORM

Validação via Form Requests

Autenticação multi-nível

🔹 Front-End

Vue.js

Interface para abertura e acompanhamento de chamados

Consumo da API via JSON

🔹 Banco de Dados

MySQL

Modelagem relacional

Estrutura normalizada para usuários, chamados e histórico

<hr>

🚀 Funcionalidades Essenciais
1️⃣ Gestão de Usuários (Multi-nível)

Usuários comuns → abrem chamados

Responsáveis técnicos → atualizam status e gerenciam atendimento

2️⃣ Abertura de Chamados

Registro contendo:

Tipo (Elétrica / Hidráulica / Outros)

Descrição

Localização

Data de abertura

3️⃣ Workflow de Atendimento

Fluxo de status:

<code> Aberto → Em Análise → Em Execução → Concluído </code>

4️⃣ Histórico da Unidade

Consulta de todos os serviços realizados por:

Sala

Bloco

Área comum

5️⃣ Notificações de Progresso (Simulado)

Exemplos:

"Técnico a caminho"

"Serviço em execução"

"Chamado finalizado"

<hr>

<code>
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
</code>
Esta estrutura será expandida conforme o avanço das sprints.

<hr>

🔐 Requisitos Técnicos

Back-End em Laravel

Banco de dados relacional

API RESTful com respostas JSON

Validação rigorosa de dados

Documentação clara dos endpoints

<hr>

📡 Endpoints da API (Estrutura Inicial)

Será detalhado conforme desenvolvimento das sprints.

🔹 Usuários

POST /api/register

POST /api/login

🔹 Chamados

GET /api/chamados

POST /api/chamados

PUT /api/chamados/{id}

GET /api/unidades/{id}/historico

<hr>

📊 Organização por Sprints

O desenvolvimento seguirá o modelo incremental:

Sprint 1 → Estrutura base da API + Autenticação

Sprint 2 → CRUD de Chamados + Workflow

Sprint 3 → Histórico por Unidade + Notificações

Sprint 4 → Integração completa com Vue + Ajustes finais

(Cronograma sujeito a ajustes conforme orientação do professor.)

<hr>

📄 Documentação da API

A documentação completa dos endpoints será adicionada conforme evolução do projeto.

Planejamento:

Padronização REST

Respostas estruturadas

Tratamento de erros

Códigos HTTP adequados

<hr>

📌 Status do Projeto

🚧 Em desenvolvimento (Modelo por Sprints)

