import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ContactCard = ({ name, relation, phone, email, closeness, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{relation}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.badge, styles.closenessBadge]}>
            <Text style={[styles.badgeText, styles.closenessText]}>{closeness}</Text>
          </View>
          {onDelete ? (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton} activeOpacity={0.7}>
              <Text style={styles.deleteText}>Sil</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.contactInfo}>
        <Text style={styles.caption}>Telefon Numarası</Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(23, 23, 23, 0.6)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameContainer: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  contactInfo: {
    flexDirection: 'column',
    gap: 4,
  },
  caption: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phone: {
    fontSize: 17,
    color: '#10B981', // Emerald 500
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue tint
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  closenessBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)', // Orange tint
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeText: {
    color: '#93C5FD', // Blue 300
    fontSize: 12,
    fontWeight: '600',
  },
  closenessText: {
    color: '#FDBA74', // Orange 300
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteText: {
    color: '#FCA5A5', // Red 300
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ContactCard;
