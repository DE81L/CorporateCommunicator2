export type SectionType = 'messages' | 'groups' | 'explanations' | 'announcements' | 'requests' | 'contacts' | 'settings' | 'wiki';

export const isValidSection = (section: string): section is SectionType => {
  return ['messages', 'groups', 'explanations', 'announcements', 'requests', 'contacts', 'settings', 'wiki'].includes(section);
};
