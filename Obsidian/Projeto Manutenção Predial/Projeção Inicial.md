## Visão Geral

Sistema web interno para abertura, gerenciamento e resolução de chamados de manutenção em prédios SENAI, escalável para qualquer unidade no Brasil. Inspirado no TOTVS Fluig para UI/UX amigável e rede social interna, mas foco inicial em chamados – com potencial para dashboard, chat e analytics. Substitui planilhas Excel, verbal e papel por processo digital 100% auditável.​

## Usuários e Papéis

Categorização por RBAC (Role-Based Access Control) para controle de permissões.
![[Pasted image 20260318154631.png]]

## Requisitos Funcionais

- **Abertura de Chamado**:
    
    - Código auto-gerado (ex: MAN-2026-001).
        
    - Descrição detalhada, anexos (imagens/arquivos).
        
    - Grau de impacto (Baixo/Médio/Alto/Crítico – dropdown com exemplos).
        
    - Data/hora automática, solicitante/área destino, prazo sugerido.
        
    - Item danificado/faltante (lista dropdown por estoque).​
        
- **Análise e Delegação**:
    
    - Priorização real (urgente/médio/espera).
        
    - Delegar a técnico/interno/externo; checar estoque.
        
    - Complexidade (simples/média/alta – com dependências, ex: elétrica + rede).
        
    - Orçamento para externo/compra; encaminhar aprovação.​
        
- **Execução e Encerramento**:
    
    - Acompanhamento em tempo real (status: Aberto/Em Andamento/Pausado/Concluído).
        
    - Provas finais (fotos), comprovantes compra, descrição solução (base de conhecimento).
        
    - Instabilidades notadas (ex: energia fraca → novo chamado auto-gerado).​
        
- **Relatórios e Histórico**:
    
    - Filtros por data, funcionário, setor, status.
        
    - Import/Export CSV/Excel; auditoria completa com anexos.​
        

## Requisitos Não-Funcionais

Complementos pra robustez:

- **UI/UX**: Responsivo (mobile-first), como rede social (feed de chamados, notificações push/email).
    
- **Segurança**: Autenticação (login SENAI), permissões por papel, logs de auditoria.
    
- **Performance**: Suporte a 100+ usuários simultâneos; backups automáticos.
    
- **Escalabilidade**: Multi-unidade (config por SENAI); integrações futuras (estoque ERP).​
    

## Fluxo Principal

1. Solicitante abre → Notificação ao analista.
    
2. Analista avalia/delega → Técnico acessa.
    
3. Técnico resolve/encerra → Aprovação automática ou manual.
    
4. Arquivamento → Relatórios disponíveis.​
    

## Ecossistema Técnico Proposto

Stack full-stack simples e gratuito pra protótipo SENAI.​
![[Pasted image 20260318154749.png]]

## Próximos Passos

- Criar wireframes no Figma.
![[Fluxograma.jpg]]

- Desenvolver MVP só com abertura/análise (1 sprint).