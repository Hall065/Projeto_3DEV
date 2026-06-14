import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Wrench,
} from 'lucide-react-native';
import {
  AppButton,
  CampusMap,
  FeedbackMessage,
  ListRow,
  MetricTile,
  SearchField,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { CampusMap3DContainer } from '@/components/maps/CampusMap3D';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { gridService } from '@/services/grid.service';
import type {
  CampusTicketMarker,
  CampusTicketMarkerKind,
  CampusTicketMarkerStatus,
} from '@/types/campusTickets';
import {
  CAMPUS_TICKET_KIND_LABELS,
  CAMPUS_TICKET_STATUS_LABELS,
} from '@/types/campusTickets';
import type { Chamado, Tarefa } from '@/types/grid.types';
import {
  buildCampusTicketMarkers,
  countTicketsByKind,
  countTicketsByStatus,
  countUnmappedGridRecords,
  ticketMarkerColor,
} from '@/utils/campusTicketMarkers';

type KindFilter = 'all' | CampusTicketMarkerKind;
type StatusFilter = 'all' | CampusTicketMarkerStatus;

const makeChannelName = () =>
  `grid-campus-map-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function MapaTarefasScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<Chamado[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError('');
      const [ticketData, taskData] = await Promise.all([
        gridService.listChamados(),
        gridService.listTarefas(),
      ]);
      setTickets(ticketData);
      setTasks(taskData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Nao foi possivel carregar a localizacao dos chamados.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = supabase.channel(makeChannelName());
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'grid', table: 'chamados' },
        () => void reload()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'grid', table: 'tarefas' },
        () => void reload()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const allMarkers = useMemo(
    () => buildCampusTicketMarkers(tasks, tickets),
    [tasks, tickets]
  );

  const filteredMarkers = useMemo(() => {
    const query = normalize(search);
    return allMarkers.filter((marker) => {
      const matchesKind = kindFilter === 'all' || marker.kind === kindFilter;
      const matchesStatus = statusFilter === 'all' || marker.status === statusFilter;
      const matchesSearch =
        !query ||
        normalize(
          [
            marker.code,
            marker.title,
            marker.room,
            marker.assignee,
            marker.blockId,
            marker.detail,
          ]
            .filter(Boolean)
            .join(' ')
        ).includes(query);
      return matchesKind && matchesStatus && matchesSearch;
    });
  }, [allMarkers, kindFilter, search, statusFilter]);

  useEffect(() => {
    if (
      selectedMarkerId &&
      !filteredMarkers.some((marker) => marker.id === selectedMarkerId)
    ) {
      setSelectedMarkerId(null);
    }
  }, [filteredMarkers, selectedMarkerId]);

  const selectedMarker =
    allMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const statusTotals = countTicketsByStatus(allMarkers);
  const kindTotals = countTicketsByKind(allMarkers);
  const unmappedCount = countUnmappedGridRecords(tasks, tickets);

  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Localizacao de chamados"
      description="Encontre chamados e tarefas por bloco no mapa 3D do campus."
      isLoading={loading}
      actionLabel="Atualizar"
      onActionPress={reload}
    >
      {error ? <FeedbackMessage variant="danger" message={error} /> : null}
      {unmappedCount > 0 ? (
        <FeedbackMessage
          variant="warning"
          message={`${unmappedCount} registro(s) nao aparecem no mapa porque nao possuem Bloco A, B, C ou D informado.`}
        />
      ) : null}

      <View style={styles.metricGrid}>
        <MetricTile
          label="No mapa"
          value={allMarkers.length}
          hint={`${kindTotals.ticket} chamados | ${kindTotals.task} tarefas`}
          accent={gridTheme.accent}
          icon={<MapPin size={16} color={gridTheme.accent} />}
          style={styles.metric}
        />
        <MetricTile
          label="Abertos"
          value={statusTotals.open}
          accent={colors.red}
          icon={<AlertTriangle size={16} color={colors.red} />}
          style={styles.metric}
        />
        <MetricTile
          label="Em andamento"
          value={statusTotals.in_progress}
          accent={colors.blue}
          icon={<Clock3 size={16} color={colors.blue} />}
          style={styles.metric}
        />
        <MetricTile
          label="Concluidos"
          value={statusTotals.completed}
          accent={colors.green}
          icon={<CheckCircle2 size={16} color={colors.green} />}
          style={styles.metric}
        />
      </View>

      <SurfaceCard
        title="Mapa 3D do campus"
        subtitle={`${filteredMarkers.length} atendimento(s) visiveis com os filtros atuais`}
      >
        <CampusMap3DContainer
          ticketMarkers={filteredMarkers}
          highlightTicketId={selectedMarkerId}
          onSelectTicket={setSelectedMarkerId}
          moduleLabel="SENAI Grid"
          minHeight={520}
          fallback={<CampusMap />}
        />
      </SurfaceCard>

      <SurfaceCard title="Filtrar atendimentos" subtitle="Refine os marcadores exibidos no mapa">
        <SearchField
          placeholder="Buscar codigo, titulo, sala ou responsavel..."
          value={search}
          onChangeText={setSearch}
        />

        <Text style={[styles.filterLabel, { color: theme.text }]}>Tipo</Text>
        <View style={styles.filterRow}>
          <AppButton
            label="Todos"
            variant={kindFilter === 'all' ? 'primary' : 'secondary'}
            accent={gridTheme.accent}
            onPress={() => setKindFilter('all')}
            wrapperStyle={styles.filterButton}
          />
          <AppButton
            label="Chamados"
            variant={kindFilter === 'ticket' ? 'primary' : 'secondary'}
            accent={gridTheme.accent}
            icon={
              <ClipboardList
                size={15}
                color={kindFilter === 'ticket' ? colors.white : gridTheme.accent}
              />
            }
            onPress={() => setKindFilter('ticket')}
            wrapperStyle={styles.filterButton}
          />
          <AppButton
            label="Tarefas"
            variant={kindFilter === 'task' ? 'primary' : 'secondary'}
            accent={gridTheme.accent}
            icon={
              <Wrench
                size={15}
                color={kindFilter === 'task' ? colors.white : gridTheme.accent}
              />
            }
            onPress={() => setKindFilter('task')}
            wrapperStyle={styles.filterButton}
          />
        </View>

        <Text style={[styles.filterLabel, { color: theme.text }]}>Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilters}
        >
          {[
            { value: 'all' as const, label: 'Todos', color: gridTheme.accent },
            { value: 'open' as const, label: 'Abertos', color: colors.red },
            { value: 'in_progress' as const, label: 'Em andamento', color: colors.blue },
            { value: 'completed' as const, label: 'Concluidos', color: colors.green },
          ].map((option) => (
            <AppButton
              key={option.value}
              label={option.label}
              variant={statusFilter === option.value ? 'primary' : 'secondary'}
              accent={option.color}
              onPress={() => setStatusFilter(option.value)}
              wrapperStyle={styles.statusButton}
              style={styles.compactButton}
            />
          ))}
        </ScrollView>
      </SurfaceCard>

      {selectedMarker ? (
        <SelectedMarkerCard
          marker={selectedMarker}
          onOpen={() =>
            router.push(
              (selectedMarker.kind === 'ticket'
                ? ROUTES.grid.chamados
                : ROUTES.grid.tarefas) as never
            )
          }
        />
      ) : null}

      <SurfaceCard
        title="Atendimentos no campus"
        subtitle="Toque em um registro para destaca-lo no mapa"
      >
        {filteredMarkers.length ? (
          filteredMarkers.map((marker) => (
            <ListRow
              key={marker.id}
              title={`${marker.code} - ${marker.title}`}
              subtitle={`${CAMPUS_TICKET_KIND_LABELS[marker.kind]} | Bloco ${marker.blockId}${marker.room ? ` | Sala ${marker.room}` : ''}`}
              badge={CAMPUS_TICKET_STATUS_LABELS[marker.status]}
              badgeVariant={statusVariant(marker.status)}
              meta={marker.assignee ?? 'Sem responsavel'}
              initials={marker.kind === 'ticket' ? 'CH' : 'TF'}
              accent={ticketMarkerColor(marker)}
              onPress={() => setSelectedMarkerId(marker.id)}
            />
          ))
        ) : (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            Nenhum chamado ou tarefa corresponde aos filtros atuais.
          </Text>
        )}
      </SurfaceCard>
    </ModuleScreen>
  );
}

function SelectedMarkerCard({
  marker,
  onOpen,
}: {
  marker: CampusTicketMarker;
  onOpen: () => void;
}) {
  const theme = useThemeColors();
  return (
    <SurfaceCard
      title="Atendimento selecionado"
      subtitle={`${CAMPUS_TICKET_KIND_LABELS[marker.kind]} localizado no Bloco ${marker.blockId}`}
    >
      <View style={styles.selectedHeader}>
        <View style={[styles.selectedIcon, { backgroundColor: `${ticketMarkerColor(marker)}18` }]}>
          {marker.kind === 'ticket' ? (
            <ClipboardList size={20} color={ticketMarkerColor(marker)} />
          ) : (
            <Wrench size={20} color={ticketMarkerColor(marker)} />
          )}
        </View>
        <View style={styles.selectedBody}>
          <Text style={[styles.selectedCode, { color: ticketMarkerColor(marker) }]}>
            {marker.code}
          </Text>
          <Text style={[styles.selectedTitle, { color: theme.text }]}>{marker.title}</Text>
        </View>
      </View>
      <Text style={[styles.selectedMeta, { color: theme.textMuted }]}>
        Bloco {marker.blockId}
        {marker.room ? ` | Sala ${marker.room}` : ''}
        {` | ${CAMPUS_TICKET_STATUS_LABELS[marker.status]}`}
      </Text>
      <Text style={[styles.selectedMeta, { color: theme.textMuted }]}>
        Responsavel: {marker.assignee ?? 'Nao atribuido'}
      </Text>
      {marker.detail ? (
        <Text numberOfLines={3} style={[styles.selectedDetail, { color: theme.textMuted }]}>
          {marker.detail}
        </Text>
      ) : null}
      <AppButton
        label={`Abrir ${CAMPUS_TICKET_KIND_LABELS[marker.kind].toLowerCase()}`}
        accent={gridTheme.accent}
        onPress={onOpen}
        wrapperStyle={styles.openButton}
      />
    </SurfaceCard>
  );
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function statusVariant(status: CampusTicketMarkerStatus) {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'info' as const;
  return 'danger' as const;
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    width: '48%',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    flex: 1,
    minWidth: 96,
  },
  statusFilters: {
    gap: 8,
    paddingRight: 12,
  },
  statusButton: {
    minWidth: 105,
  },
  compactButton: {
    minHeight: 40,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBody: {
    flex: 1,
    minWidth: 0,
  },
  selectedCode: {
    fontSize: 10,
    fontWeight: '900',
  },
  selectedTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '900',
  },
  selectedMeta: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedDetail: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  openButton: {
    marginTop: 12,
  },
  empty: {
    fontSize: 12,
    fontWeight: '700',
  },
});
