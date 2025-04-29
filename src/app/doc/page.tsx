import React from "react";

const steps = [
  {
    step: "Login to portal.aiub.edu",
    image: "/images/step1.png",
    link: "https://portal.aiub.edu",
  },
  {
    step: "Download the Offered Courses Excel file",
    image: "/images/step2.png",
  },
  {
    step: "Go to: Aiub Class Scheduler",
    image: "/images/step3.png",
    link: "https://www.aiubclassscheduler.me/",
  },
  {
    step: "Upload the file",
    image: "/images/step4.png",
  },
  {
    step: "Select preferred courses and click on Create Schedule",
    image: "/images/step5.png",
  },
  {
    step: "View multiple clash-free schedules",
    image: "/images/step6.png",
  },
  {
    step: "Export your routine if needed!",
    image: "/images/step7.png",
  },
  {
    step: "Provide feedback through the feedback form.",
    image: "/images/step8.png",
  },
];

const Doc = () => {
  return (
    <div className="bg-gray-50 text-black container mx-auto p-6 min-h-screen flex flex-col items-center">
      {/* Header Section */}
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-blue-600">
          AIUB Class Scheduler
        </h1>
      </header>

      {/* Main Content */}
      <h2 className="text-4xl font-extrabold mb-6 text-center">
        How to Use the App
      </h2>
      <p className="text-lg mb-8 text-center">
        Follow these steps to get started:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((item, index) => (
          <div
            key={index}
            className="relative bg-white p-6 rounded shadow-lg hover:shadow-xl transition duration-300"
          >
            <p className="text-lg font-medium mb-4">
              <span className="font-bold text-blue-500 mr-2">{index + 1}.</span>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {item.step}
                </a>
              ) : (
                item.step
              )}
            </p>
            <img
              src={item.image}
              alt={`Illustration for step ${index + 1}`}
              className="w-full max-w-md rounded object-cover scale-100 hover:scale-105 transition-transform duration-300 border-2 border-blue-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doc;
