import React from 'react';

// Disabled tutorial controller - empty component
const TutorialController: React.FC = () => {
  // On component mount, save to localStorage that the tutorial is completed
  React.useEffect(() => {
    try {
      localStorage.setItem('tutorial-completed', 'true');
    } catch (error) {
      console.error('Failed to set tutorial-completed in localStorage:', error);
    }
  }, []);

  // Return nothing - tutorial is disabled
  return null;
};

export default TutorialController;