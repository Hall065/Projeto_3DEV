import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase service role nao configurado' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'connect' },
    auth: { persistSession: false },
  });

  const body = await req.json();
  const alunoId = body.aluno_id;
  const mesReferencia = body.mes_referencia ?? body.mes ?? new Date().toISOString().slice(0, 7);
  if (!alunoId) {
    return new Response(JSON.stringify({ error: 'aluno_id e obrigatorio' }), { status: 400 });
  }

  const { data: contrato } = await supabase
    .from('contratos_alunos')
    .select('id,empresa_id,carga_horaria')
    .eq('aluno_id', alunoId)
    .maybeSingle();

  const { data: frequencias } = await supabase
    .from('frequencias')
    .select('status,quantidade_aulas_faltadas,aulas!inner(data_aula)')
    .eq('aluno_id', alunoId)
    .gte('aulas.data_aula', `${mesReferencia}-01`)
    .lt('aulas.data_aula', nextMonth(mesReferencia));

  const totalFaltasInjustificadas = (frequencias ?? []).reduce((sum, row: any) => {
    return sum + (row.status === 'falta_injustificada' ? row.quantidade_aulas_faltadas ?? 1 : 0);
  }, 0);
  const diasUteis = 20;
  const diasTrabalhados = Math.max(0, diasUteis - totalFaltasInjustificadas);
  const base = `${contrato?.carga_horaria ?? ''}`.includes('4') ? 759 : 1518;
  const valorDia = base / diasUteis;
  const desconto = valorDia * totalFaltasInjustificadas;
  const salarioFinal = base - desconto;
  const frequenciaPerc = Math.round((diasTrabalhados / diasUteis) * 1000) / 10;
  const payload = {
    aluno_id: alunoId,
    contrato_id: contrato?.id,
    empresa_id: contrato?.empresa_id,
    mes_referencia: mesReferencia,
    salario_base: base,
    valor_dia: valorDia,
    desconto,
    salario_final: salarioFinal,
    frequencia_percentual: frequenciaPerc,
    dias_trabalhados: diasTrabalhados,
    faltas_injustificadas: totalFaltasInjustificadas,
  };

  const { data: existing } = await supabase
    .from('calculos_salario')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('mes_referencia', mesReferencia)
    .maybeSingle();

  const result = existing
    ? await supabase.from('calculos_salario').update(payload).eq('id', existing.id).select('*').single()
    : await supabase.from('calculos_salario').insert(payload).select('*').single();

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message, calculo: payload }), { status: 400 });
  }

  return new Response(JSON.stringify(result.data), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function nextMonth(mesReferencia: string) {
  const [year, month] = mesReferencia.split('-').map(Number);
  return new Date(year, month, 1).toISOString().slice(0, 10);
}
