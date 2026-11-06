import { Text } from '@/components/AppText';
import ConfirmModal from '@/components/ConfirmModal';
import { Badge } from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEMES = [
  { key: 'light', label: 'Light', icon: 'sun.max' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
  { key: 'system', label: 'System', icon: 'gear' },
] as const;

const initialsOf = (name?: string) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  if (phone.startsWith('+')) return phone;
  return `+91 ${phone}`;
};

export default function ProfileScreen() {
  const { colorScheme, themePreference, setThemePreference } = useTheme();
  const colors = Colors[colorScheme];
  const { state, logout, refreshUser } = useAuth();
  const { show: showToast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const comingSoon = () => showToast("This isn't available yet. Coming soon!", 'info');

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  // Rows that are not built yet are marked "Soon" instead of silently doing nothing
  const sections = [
    {
      title: 'Account',
      rows: [
        { icon: 'person.circle', label: 'Edit profile' },
        { icon: 'location', label: 'Saved addresses' },
        { icon: 'creditcard', label: 'Payment methods' },
      ],
    },
    {
      title: 'Support',
      rows: [
        { icon: 'questionmark.circle', label: 'Help center' },
        { icon: 'doc.text', label: 'Terms & conditions' },
        { icon: 'shield', label: 'Privacy policy' },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Account card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.textInverse + '26' }]}>
            <Text style={[styles.avatarText, { color: colors.textInverse }]}>{initialsOf(state.user?.name)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.textInverse }]} numberOfLines={1}>
              {state.user?.name || 'Guest'}
            </Text>
            <Text style={[styles.userPhone, { color: colors.textInverse + 'D9' }]}>
              {formatPhone(state.user?.phoneNumber)}
            </Text>
            {!!state.user?.email && (
              <Text style={[styles.userPhone, { color: colors.textInverse + 'D9' }]} numberOfLines={1}>
                {state.user.email}
              </Text>
            )}
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          {THEMES.map(({ key, label, icon }) => {
            const selected = themePreference === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => setThemePreference(key)}
                style={[styles.themeOption, selected && { backgroundColor: colors.primary + '1A', borderColor: colors.primary }]}
              >
                <IconSymbol name={icon as any} size={20} color={selected ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeLabel, { color: selected ? colors.primary : colors.textSecondary }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sections.map((section) => (
          <View key={section.title}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              {section.rows.map((row, index) => (
                <TouchableOpacity
                  key={row.label}
                  activeOpacity={0.7}
                  onPress={comingSoon}
                  style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.primary + '14' }]}>
                    <IconSymbol name={row.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{row.label}</Text>
                  <Badge label="Soon" tone="neutral" />
                  <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLogoutModal(true)}
          style={[styles.signOut, { borderColor: colors.error + '66', backgroundColor: colors.error + '0F' }]}
        >
          <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>GoGenie v1.0.0</Text>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        danger
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 130 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, gap: 16, marginBottom: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  profileInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  userPhone: { fontSize: 13 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  themeRow: { flexDirection: 'row', padding: 6, gap: 6 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  themeLabel: { fontSize: 12, fontWeight: Typography.fontWeight.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: Typography.fontWeight.medium },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
  },
  signOutText: { fontSize: 15, fontWeight: Typography.fontWeight.semibold },
  version: { textAlign: 'center', fontSize: 12, marginTop: 18 },
});
