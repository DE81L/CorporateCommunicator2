export const isValidSection = (section) => {
    return ['messages', 'groups', 'announcements', 'requests', 'contacts', 'settings', 'wiki'].includes(section);
};
