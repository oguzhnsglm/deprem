import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ContactCard = ({ name, relation, phone, email, closeness }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={[styles.badge, styles.closenessBadge]}>
          <Text style={styles.badgeText}>{closeness}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{relation}</Text>
        </View>
        <Text style={styles.email}>{email}</Text>
      </View>
      <Text style={styles.caption}>Hızlı arama / mesaj</Text>
      <Text style={styles.phone}>{phone}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff7f9',
    borderRadius: 18,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: 'rgba(190, 24, 93, 0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#831843',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fda4af',
  },
  closenessBadge: {
    backgroundColor: '#fbcfe8',
  },
  badgeText: {
    color: '#9d174d',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  email: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  phone: {
    fontSize: 18,
    color: '#047857',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default ContactCard;
