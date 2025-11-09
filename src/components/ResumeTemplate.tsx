import React from "react";

interface ResumeData {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  summary?: string;
  experience: {
    jobTitle: string;
    company: string;
    startDate?: string;
    endDate?: string;
    responsibilities: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    startDate?: string;
    endDate?: string;
  }[];
  skills: string[];
  projects?: {
    title: string;
    description: string;
  }[];
  certifications?: string[];
}


interface ResumeTemplateProps {
  resume: ResumeData;
}

const ResumeTemplate: React.FC<ResumeTemplateProps> = ({ resume }) => {
  return (
    <div
      id="resume-container"
      className="max-w-4xl mx-auto p-8 bg-white text-gray-800 leading-relaxed"
    >
      {/* Personal Info */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">{resume.personalInfo.name}</h1>
        <p className="text-gray-700">
          {resume.personalInfo.email}{" "}
          {resume.personalInfo.phone && `| ${resume.personalInfo.phone}`}{" "}
          {resume.personalInfo.linkedin && `| ${resume.personalInfo.linkedin}`}
        </p>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-1">Summary</h2>
          <p>{resume.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Experience</h2>
          {resume.experience.map((exp, idx) => (
            <div key={idx} className="mb-3">
              <p className="font-semibold text-gray-800">
                {exp.jobTitle} – {exp.company}{" "}
                {exp.startDate && `(${exp.startDate}`} {exp.endDate && `- ${exp.endDate})`}
              </p>
              <ul className="list-disc ml-5 mt-1">
                {exp.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Education</h2>
          {resume.education.map((edu, idx) => (
            <p key={idx} className="mb-1">
              <span className="font-semibold">{edu.degree}</span>, {edu.institution}{" "}
              {edu.startDate && `(${edu.startDate}`} {edu.endDate && `- ${edu.endDate})`}
            </p>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Skills</h2>
          <p>{resume.skills.join(", ")}</p>
        </div>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Projects</h2>
          {resume.projects.map((p, idx) => (
            <div key={idx} className="mb-2">
              <p className="font-semibold">{p.title}</p>
              <p>{p.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Certifications</h2>
          <ul className="list-disc ml-5">
            {resume.certifications.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeTemplate;
