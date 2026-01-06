import { portfolioData } from '@/data/portfolio'

export default function Experience() {
  const { experience } = portfolioData

  return (
    <section id="experience" className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Experience</h2>
        <p className="text-gray-600 text-center mb-12 text-base md:text-lg">
          I've built production systems, led technical teams, and taught coding to 100+ students.
        </p>
        
        <div className="space-y-8">
          {experience.map((exp: any, index: number) => (
            <div key={index} className="bg-white border-l-4 border-blue-600 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{exp.role}</h3>
                  <p className="text-lg text-blue-600 font-medium">{exp.company}</p>
                </div>
                <div className="text-gray-600 mt-2 md:mt-0 md:text-right text-sm md:text-base">
                  <p className="font-medium">{exp.period}</p>
                  <p>{exp.location}</p>
                </div>
              </div>
              
              <ul className="space-y-3">
                {exp.bullets.map((bullet: string, bulletIndex: number) => (
                  <li key={bulletIndex} className="text-gray-700 flex items-start text-sm md:text-base">
                    <span className="text-blue-600 mr-3 mt-1.5 flex-shrink-0 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}