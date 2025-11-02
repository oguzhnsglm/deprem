import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ContactCard = ({ name, relation, phone }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{relation}</Text>
        </View>
      </View>
      <Text style={styles.caption}>Hizli arama / mesaj</Text>
      <Text style={styles.phone}>{phone}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 18,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#0b021f',
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
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fdf4ff',
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.6)',
  },
  badgeText: {
    color: '#ede9fe',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 14,
    color: 'rgba(237, 233, 254, 0.8)',
    marginBottom: 4,
  },
  phone: {
    fontSize: 18,
    color: '#ddd6fe',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default ContactCard;
