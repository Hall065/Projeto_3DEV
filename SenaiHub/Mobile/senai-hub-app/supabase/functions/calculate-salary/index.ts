import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { aluno_id, mes, salario_base, faltas_injustificadas, dias_uteis_mes, outros_descontos } =
    await req.json();

  const valorPorDia = salario_base / dias_uteis_mes;
  const salario_final =
    salario_base - valorPorDia * (faltas_injustificadas ?? 0) - (outros_descontos ?? 0);

  // TODO: persistir em connect.calculos_salario com service role
  return new Response(
    JSON.stringify({ aluno_id, mes, salario_final, valor_por_dia: valorPorDia }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
