import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { glass } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import type { HomeScreenProps } from '../../navigation/types';
import type { MuscleGroup, InjuryCondition, InjurySeverity } from '@barbellix/shared';
import { INJURY_CONDITION_LABELS, INJURY_CONDITION_MUSCLE_GROUPS, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, INJURY_SEVERITIES } from '@barbellix/shared';
import { styles } from './AIWizard.styles';

type DraftInjury = { bodyPart: MuscleGroup; condition?: InjuryCondition; severity: InjurySeverity; note?: string };

export function AIWizardInjuriesScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardInjuries'>['navigation']>();
  const route = useRoute<HomeScreenProps<'AIWizardInjuries'>['route']>();
  const [injuries, setInjuries] = useState<DraftInjury[]>(route.params.injuries ?? []);

  const [bodyPart, setBodyPart] = useState<MuscleGroup | undefined>();
  const [condition, setCondition] = useState<InjuryCondition | undefined>();
  const [severity, setSeverity] = useState<InjurySeverity>('mild');
  const [note, setNote] = useState('');

  const relevantConditions = useMemo(() => {
    return (Object.entries(INJURY_CONDITION_MUSCLE_GROUPS) as [InjuryCondition, MuscleGroup[]][])
      .filter(([, groups]) => groups.length === 0 || (bodyPart ? groups.includes(bodyPart) : false))
      .map(([id]) => id);
  }, [bodyPart]);

  const handlePickCondition = (id: InjuryCondition) => {
    setCondition((prev) => (prev === id ? undefined : id));
    const groups = INJURY_CONDITION_MUSCLE_GROUPS[id];
    if (groups.length > 0 && !bodyPart) setBodyPart(groups[0]);
  };

  const handleAdd = () => {
    if (!bodyPart) return;
    setInjuries((prev) => [...prev, { bodyPart, condition, severity, note: note.trim() || undefined }]);
    setBodyPart(undefined);
    setCondition(undefined);
    setSeverity('mild');
    setNote('');
  };

  const handleRemove = (index: number) => {
    setInjuries((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <WizardShell
      step={5}
      totalSteps={6}
      title="Any injuries to work around?"
      subtitle="Optional, but this is what keeps the AI from recommending exercises that could aggravate an injury."
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          label={injuries.length === 0 ? 'Skip — no injuries' : `Continue with ${injuries.length} logged →`}
          onPress={() => navigation.navigate('AIWizardReview', { ...route.params, injuries })}
        />
      }
    >
      {injuries.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Logged this session</Text>
          {injuries.map((injury, index) => (
            <View key={`${injury.bodyPart}-${index}`} style={[styles.injuryItem, glass.card]}>
              <View style={styles.injuryItemText}>
                <Text style={styles.injuryItemTitle}>
                  {injury.condition ? INJURY_CONDITION_LABELS[injury.condition] : MUSCLE_GROUP_LABELS[injury.bodyPart]}
                </Text>
                <Text style={styles.injuryItemMeta}>{MUSCLE_GROUP_LABELS[injury.bodyPart]} · {injury.severity}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(index)}>
                <Text style={styles.removeBtnText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionLabel}>Body part</Text>
      <View style={styles.chipGrid}>
        {MUSCLE_GROUPS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, m === bodyPart && styles.chipActive]}
            onPress={() => { setBodyPart(m); setCondition(undefined); }}
          >
            <Text style={[styles.chipText, m === bodyPart && styles.chipTextActive]}>{MUSCLE_GROUP_LABELS[m]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {bodyPart && relevantConditions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Specific condition (optional)</Text>
          <View style={styles.chipGrid}>
            {relevantConditions.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.chip, id === condition && styles.chipActive]}
                onPress={() => handlePickCondition(id)}
              >
                <Text style={[styles.chipText, id === condition && styles.chipTextActive]}>{INJURY_CONDITION_LABELS[id]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {bodyPart && (
        <>
          <Text style={styles.sectionLabel}>Severity</Text>
          <View style={styles.chipGrid}>
            {INJURY_SEVERITIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, s === severity && styles.chipActive]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.chipText, s === severity && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. flares up on overhead pressing"
          />

          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add this injury</Text>
          </TouchableOpacity>
        </>
      )}
    </WizardShell>
  );
}
