import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './BranchSettingsScreen.styles';

function ToggleRow({ emoji, label, sub, value, onChange }: { emoji: string; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, glass.card]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary + '80' }} thumbColor={value ? colors.primary : colors.textMuted} />
    </View>
  );
}

function TextRow({ emoji, label, sub, value, onChange, placeholder }: { emoji: string; label: string; sub?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View style={[styles.row, glass.card]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} textAlign="right" />
    </View>
  );
}

function InfoRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={[styles.row, glass.card]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function BranchSettingsScreen() {
  const navigation = useNavigation();
  const [branchName, setBranchName] = useState('BarBellix — Main Branch');
  const [capacity, setCapacity] = useState('120');
  const [qrEnabled, setQrEnabled] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(true);
  const [autoCheckout, setAutoCheckout] = useState(true);
  const [guestPass, setGuestPass] = useState(false);

  return (
    <ScreenShell title="Branch Settings" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Branch Info</Text>
            <TextRow emoji="🏢" label="Branch Name" value={branchName} onChange={setBranchName} />
            <TextRow emoji="👥" label="Max Capacity" value={capacity} onChange={setCapacity} placeholder="120" />
            <InfoRow emoji="🌐" label="Branch ID" value="branch_001" />
            <InfoRow emoji="📅" label="Created" value="Jan 2025" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-In Methods</Text>
            <ToggleRow emoji="📷" label="QR Code" sub="Members scan a rotating QR at the entrance" value={qrEnabled} onChange={setQrEnabled} />
            <ToggleRow emoji="📡" label="NFC Tap" sub="Contactless tap with NFC-enabled phone" value={nfcEnabled} onChange={setNfcEnabled} />
            <ToggleRow emoji="🔢" label="Daily PIN" sub="6-digit PIN shown in member app each day" value={pinEnabled} onChange={setPinEnabled} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Rules</Text>
            <ToggleRow emoji="🚪" label="Auto Check-Out" sub="Automatically check out members after 3 hours" value={autoCheckout} onChange={setAutoCheckout} />
            <ToggleRow emoji="🎫" label="Guest Passes" sub="Allow members to bring one guest per visit" value={guestPass} onChange={setGuestPass} />
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={() => Alert.alert('Reset Settings', 'This will reset all branch settings to defaults. Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive' }])}>
            <Text style={styles.dangerBtnText}>Reset to Defaults</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
