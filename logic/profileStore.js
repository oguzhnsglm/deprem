let profileData = {
  city: 'İstanbul',
  threshold: 5,
  name: '',
  surname: '',
};

export const getProfilePreferences = () => profileData;

export const setProfilePreferences = (updates) => {
  profileData = {
    ...profileData,
    ...updates,
  };
};

export default profileData;
