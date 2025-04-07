export type SectionType = 'messages' | 'groups' | 'announcements' | 'requests' | 'contacts' | 'settings';

export const isValidSection = (section: string): section is SectionType => {
  return ['messages', 'groups', 'announcements', 'requests', 'contacts', 'settings'].includes(section);
};