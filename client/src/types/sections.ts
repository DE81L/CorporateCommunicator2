export type SectionType = 'messages' | 'groups' | 'announcements' | 'requests' | 'contacts' | 'settings' | 'wiki';

export const isValidSection = (section: string): section is SectionType => {
  return ['messages', 'groups', 'announcements', 'requests', 'contacts', 'settings', 'wiki'].includes(section);
};