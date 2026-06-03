import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, CheckCheck, X } from 'lucide-react-native';
import { AnimatedPressable, AppButton, FeedbackMessage } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import type { Notificacao } from '@/services/notification.service';

interface NotificationsModalProps {
  visible: boolean;
  notifications: Notificacao[];
  loading?: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void | Promise<void>;
  onMarkAllAsRead: () => void | Promise<void>;
}

export function NotificationsModal({
  visible,
  notifications,
  loading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Bell size={18} color={colors.navy} />
              <Text style={styles.title}>Notificacoes</Text>
            </View>
            <AnimatedPressable style={styles.closeButton} onPress={onClose}>
              <X size={18} color={colors.navy} />
            </AnimatedPressable>
          </View>

          <AppButton
            label="Marcar todas como lidas"
            variant="secondary"
            accent={colors.navy}
            icon={<CheckCheck size={16} color={colors.navy} />}
            onPress={onMarkAllAsRead}
            disabled={notifications.every((notification) => notification.lida)}
          />

          <ScrollView contentContainerStyle={styles.list}>
            {loading ? <FeedbackMessage message="Carregando notificacoes..." /> : null}
            {!loading && notifications.length === 0 ? (
              <FeedbackMessage variant="neutral" message="Nenhuma notificacao encontrada." />
            ) : null}
            {notifications.map((notification) => (
              <AnimatedPressable
                key={notification.id}
                style={[styles.item, !notification.lida && styles.itemUnread]}
                onPress={() => onMarkAsRead(notification.id)}
              >
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{notification.titulo}</Text>
                  {!notification.lida ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.itemText}>{notification.mensagem}</Text>
                <Text style={styles.itemDate}>
                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  sheet: {
    maxHeight: '84%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: colors.white,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.navy, fontSize: 18, fontWeight: '900' },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 10, paddingTop: 12, paddingBottom: 10 },
  item: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 12,
  },
  itemUnread: { borderColor: colors.blue, backgroundColor: '#E8F1FF' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { flex: 1, color: colors.navy, fontSize: 13, fontWeight: '900' },
  itemText: { color: colors.grayText, fontSize: 12, lineHeight: 17, marginTop: 5 },
  itemDate: { color: colors.grayText, fontSize: 10, fontWeight: '700', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
});
