import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BrandMark } from '../../components/common/BrandMark';
import { styles } from './SplashScreen.styles';

export function SplashScreen() {
  const navigation = useNavigation<any>();
  const scale = new Animated.Value(0.6);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => navigation.replace('Onboarding'), 1200);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <BrandMark size={88} style={styles.logo} />
        <Text style={styles.brand}>BarBellix</Text>
        <Text style={styles.tagline}>Feel every rep.</Text>
      </Animated.View>
    </View>
  );
}
