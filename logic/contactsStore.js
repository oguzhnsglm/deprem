let emergencyContacts = [];

export const getEmergencyContacts = () => emergencyContacts;

export const setEmergencyContacts = (nextContacts) => {
  emergencyContacts = Array.isArray(nextContacts) ? [...nextContacts] : [];
};

export const addEmergencyContact = (contact) => {
  emergencyContacts = [...emergencyContacts, contact];
};
