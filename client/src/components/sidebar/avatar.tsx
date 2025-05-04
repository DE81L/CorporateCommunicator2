import React from 'react';

interface AvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
  };
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  return (
    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
      {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
    </div>
  );
};

export default Avatar;