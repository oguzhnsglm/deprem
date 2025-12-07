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
    backgroundColor: '#180606',
    borderRadius: 18,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    shadowColor: 'rgba(127, 29, 29, 0.35)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
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
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(185, 28, 28, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  closenessBadge: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
  },
  badgeText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  email: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    color: '#f1f5f9',
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
