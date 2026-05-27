import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  type ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Grid3x3,
  LogOut,
} from 'lucide-react-native';
import { AnimatedPressable, FeedbackMessage } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { canAccessConnect, canAccessGrid } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';

const hubLogo = require('../assets/brand/senai-hub-logo.png');
const connectCardImage = require('../assets/brand/hub-connect-card.png');
const gridCardImage = require('../assets/brand/hub-grid-card.png');

interface AppCardProps {
  title: string;
  description: string;
  accent: string;
  onPress: () => void;
  icon: ReactNode;
  image: ImageSourcePropType;
}

function AppCard({ title, description, accent, onPress, icon, image }: AppCardProps) {
  return (
    <AnimatedPressable accessibilityRole="button" style={styles.card} onPress={onPress}>
      <View style={styles.illustration}>
        <Image source={image} style={styles.illustrationImage} resizeMode="cover" />
      </View>
      <View style={styles.cardHeader}>
        <View style={[styles.appIcon, { backgroundColor: accent }]}>{icon}</View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <CheckCircle2 size={15} color={colors.green} />
        <Text style={styles.cardMetaText}>Acesso liberado conforme seu perfil</Text>
      </View>
      <View style={styles.accessBtn}>
        <Text style={styles.accessBtnText}>Acessar aplicativo</Text>
        <ArrowRight size={16} color={colors.white} />
      </View>
    </AnimatedPressable>
  );
}

export default function HubScreen() {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    }
  }, [session, router]);

  if (!session?.perfil) return null;

  const initials = session.perfil.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const apps = [];
  if (canAccessConnect(session.perfil, session.aplicacoes)) {
    apps.push({
      key: 'connect',
      title: 'SENAI Connect',
      description: 'Gestão completa de alunos, turmas, frequência, contratos e informações acadêmicas.',
      accent: colors.red,
      route: '/connect' as const,
      icon: <BookOpen color={colors.white} size={26} />,
      image: connectCardImage,
    });
  }
  if (canAccessGrid(session.perfil, session.aplicacoes)) {
    apps.push({
      key: 'grid',
      title: 'SENAI Grid',
      description: 'Gestão de manutenção predial, infraestrutura, chamados, estoque e equipes.',
      accent: colors.green,
      route: '/grid' as const,
      icon: <Grid3x3 color={colors.white} size={26} />,
      image: gridCardImage,
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topbar}>
        <Image source={hubLogo} style={styles.logo} resizeMode="contain" />
        <View style={styles.topActions}>
          <View style={styles.iconAction}>
            <Bell size={19} color={colors.navy} />
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <AnimatedPressable
            style={styles.iconAction}
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            hitSlop={8}
          >
            <LogOut size={19} color={colors.grayText} />
          </AnimatedPressable>
        </View>
      </View>

      <Text style={styles.eyebrow}>Bem-vindo, {session.perfil.nome.split(' ')[0]}</Text>
      <Text style={styles.hubTitle}>Hub de Aplicações</Text>
      <Text style={styles.description}>Acesse os sistemas disponíveis para o seu perfil.</Text>

      <FeedbackMessage
        variant="info"
        message="Os aplicativos exibidos abaixo dependem do seu perfil e permissões de acesso."
        style={styles.infoBox}
      />

      <View style={styles.cards}>
        {apps.map((app) => (
          <AppCard
            key={app.key}
            title={app.title}
            description={app.description}
            accent={app.accent}
            icon={app.icon}
            image={app.image}
            onPress={() => router.push(app.route)}
          />
        ))}
      </View>

      {apps.length === 0 ? (
        <FeedbackMessage
          variant="warning"
          message="Nenhuma aplicação liberada para seu perfil."
          style={styles.emptyMessage}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 34 },
  topbar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  logo: { width: 156, height: 50 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  eyebrow: { color: colors.grayText, fontSize: 13, fontWeight: '700' },
  hubTitle: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 4 },
  description: { color: colors.grayText, fontSize: 13, marginTop: 5 },
  infoBox: { marginTop: 18 },
  cards: { gap: 14 },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  illustration: {
    height: 160,
    borderRadius: 8,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  cardDesc: { color: colors.grayText, fontSize: 12, lineHeight: 17, marginTop: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  cardMetaText: { color: colors.grayText, fontSize: 11, fontWeight: '700' },
  accessBtn: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  accessBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  emptyMessage: { marginTop: 18 },
});
