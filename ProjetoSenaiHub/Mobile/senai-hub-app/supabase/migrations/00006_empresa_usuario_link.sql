-- Vinculo entre usuario empresa (hub) e empresa parceira (connect).

alter table if exists hub.usuarios
  add column if not exists empresa_id uuid references connect.empresas(id) on delete set null;

alter table if exists connect.empresas
  add column if not exists usuario_id uuid references hub.usuarios(id) on delete set null;

create index if not exists usuarios_empresa_id_idx on hub.usuarios (empresa_id);
create index if not exists empresas_usuario_id_idx on connect.empresas (usuario_id);
