import React from 'react';
// Ensure Tailwind CSS is configured in your project [4]

function CenteredText() {
  const placeholder = "this is a sample paragraph."; // Example text

  return (
    // Container div using flexbox to center content [2]
    <div className="flex items-center justify-center h-screen bg-gray-600">
      <p className="text-4xl"> 
        {placeholder}
      </p>
    </div>
  );
}

export default CenteredText;
