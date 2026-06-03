import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { AuthSession } from '@/types/auth.types';

export const SENAI_GEOFENCE_TASK = 'SENAI_STUDENT_GEOFENCE_TASK';
const CONTEXT_KEY = 'senai_hub:student_geofence_context';

export const SENAI_GEOFENCE = {
  identifier: 'senai_luiz_vargas_limeira',
  latitude: Number(process.env.EXPO_PUBLIC_SENAI_LATITUDE ?? -22.5648),
  longitude: Number(process.env.EXPO_PUBLIC_SENAI_LONGITUDE ?? -47.4014),
  radius: Number(process.env.EXPO_PUBLIC_SENAI_RAIO_METROS ?? 150),
  notifyOnEnter: true,
  notifyOnExit: true,
};

interface GeofenceContext {
  userId: string;
  alunoId: string;
}

async function getAlunoIdByUserId(userId: string) {
  const { data, error } = await supabase
    .schema('connect')
    .from('alunos')
    .select('id')
    .eq('usuario_id', userId)
    .maybeSingle();

  if (error) return null;
  return (data as { id?: string } | null)?.id ?? null;
}

async function publishLocation(context: GeofenceContext, inside: boolean) {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const payload = {
    aluno_id: context.alunoId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    dentro_do_senai: inside,
    dentro_perimetro: inside,
    data_hora: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    precisao_metros: position.coords.accuracy,
  };

  const { error: updateError } = await supabase
    .schema('connect')
    .from('localizacoes_alunos')
    .update(payload as never)
    .eq('aluno_id', context.alunoId);

  if (updateError) {
    await supabase.schema('connect').from('localizacoes_alunos').insert(payload as never);
  }
}

if (!TaskManager.isTaskDefined(SENAI_GEOFENCE_TASK)) {
  TaskManager.defineTask(SENAI_GEOFENCE_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[Geofence] task error', error.message);
      return;
    }

    const rawContext = await AsyncStorage.getItem(CONTEXT_KEY);
    if (!rawContext) return;

    const context = JSON.parse(rawContext) as GeofenceContext;
    const eventType = (data as { eventType?: Location.GeofencingEventType })?.eventType;
    const inside = eventType === Location.GeofencingEventType.Enter;

    await publishLocation(context, inside);
  });
}

export async function startStudentGeofence(session: AuthSession | null) {
  if (Platform.OS === 'web' || session?.perfil?.tipo !== 'aluno') return;

  const alunoId = await getAlunoIdByUserId(session.userId);
  if (!alunoId) return;

  await AsyncStorage.setItem(CONTEXT_KEY, JSON.stringify({ userId: session.userId, alunoId }));

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return;

  const hasStarted = await Location.hasStartedGeofencingAsync(SENAI_GEOFENCE_TASK);
  if (hasStarted) {
    await Location.stopGeofencingAsync(SENAI_GEOFENCE_TASK);
  }

  await Location.startGeofencingAsync(SENAI_GEOFENCE_TASK, [SENAI_GEOFENCE]);
}

export async function stopStudentGeofence() {
  await AsyncStorage.removeItem(CONTEXT_KEY);
  if (Platform.OS === 'web') return;

  const hasStarted = await Location.hasStartedGeofencingAsync(SENAI_GEOFENCE_TASK);
  if (hasStarted) {
    await Location.stopGeofencingAsync(SENAI_GEOFENCE_TASK);
  }
}
