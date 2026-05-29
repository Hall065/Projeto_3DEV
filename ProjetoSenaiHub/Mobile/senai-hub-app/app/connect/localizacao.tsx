import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapPin, Navigation, ShieldCheck, Users } from 'lucide-react-native';
import { ListRow, MetricTile, Pill, SurfaceCard } from '@/components/common/VisualPrimitives';
import { CampusMap25D } from '@/components/maps/CampusMap25D';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';
import type { LocalizacaoAluno } from '@/types/connect.types';

function getLocationKey(item: LocalizacaoAluno) {
  return item.id ?? item.aluno_id;
}

export default function LocalizacaoScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LocalizacaoAluno[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    connectService
      .listLocalizacoes()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    setSelectedId((current) => {
      const currentExists = items.some((item) => getLocationKey(item) === current);
      return currentExists ? current : getLocationKey(items[0]);
    });
  }, [items]);

  const noCampus = items.filter((item) => item.dentro_perimetro).length;
  const emAula = items.filter((item) => item.em_aula).length;
  const fora = items.length - noCampus;

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Localização"
      description="Status dos alunos no campus e geofence do SENAI."
      isLoading={loading}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="No campus" value={noCampus} accent={colors.green} icon={<Users size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Em aula" value={emAula} accent={colors.blue} icon={<Navigation size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Fora da área" value={fora} accent={colors.red} icon={<MapPin size={16} color={colors.red} />} style={styles.metric} />
        <MetricTile label="Geofence" value="Ativo" accent={connectTheme.accent} icon={<ShieldCheck size={16} color={connectTheme.accent} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Mapa 2.5D do campus" subtitle="Presença e deslocamento em tempo real">
        <View style={styles.legend}>
          <Pill label="No campus" variant="success" />
          <Pill label="Em aula" variant="info" />
          <Pill label="Fora" variant="danger" />
        </View>
        <CampusMap25D
          locations={items}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(getLocationKey(item))}
        />
      </SurfaceCard>

      <SurfaceCard title="Alunos de curso técnico" subtitle="Últimas atualizações de localização">
        {items.slice(0, 8).map((item) => {
          const itemKey = getLocationKey(item);
          const selected = itemKey === selectedId;
          return (
            <ListRow
              key={itemKey}
              title={item.aluno_nome ?? item.aluno_id ?? 'Aluno não vinculado'}
              subtitle={`${item.latitude ?? '-'}, ${item.longitude ?? '-'} • precisão ${item.precisao_metros ?? '-'}m`}
              badge={selected ? 'No mapa' : item.dentro_perimetro ? 'No campus' : 'Fora'}
              badgeVariant={selected ? 'info' : item.dentro_perimetro ? 'success' : 'danger'}
              meta={item.data_hora ? new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined}
              initials="LC"
              accent={selected ? connectTheme.accent : item.dentro_perimetro ? colors.green : colors.red}
              onPress={() => setSelectedId(itemKey)}
            />
          );
        })}
      </SurfaceCard>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
