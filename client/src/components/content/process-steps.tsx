import React from "react";

const ProcessSteps = () => {
  const processSteps = [
    {
      number: 1,
      title: "Generate Content",
      description: "Choose a content type and provide a brief prompt. Our AI will generate text, images, or both.",
      borderColor: "border-primary"
    },
    {
      number: 2,
      title: "Edit & Refine",
      description: "Review and edit the generated content to match your brand voice and requirements.",
      borderColor: "border-secondary"
    },
    {
      number: 3,
      title: "Schedule & Publish",
      description: "Set a schedule for your content or publish immediately to your connected platforms.",
      borderColor: "border-primary-dark"
    }
  ];

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold font-display text-dark mb-6">Create Content in 3 Simple Steps</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {processSteps.map((step, index) => (
          <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border-t-4 ${step.borderColor} relative`}>
            <div className={`absolute -top-4 -left-4 ${step.borderColor.replace('border', 'bg')} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold`}>
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-dark mb-3">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessSteps;
