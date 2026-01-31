import React from 'react';
import { HiInbox } from 'react-icons/hi';

const EmptyState = ({ 
  icon: Icon = HiInbox, 
  title = 'No data found', 
  description = 'There is no data to display at the moment.',
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
