import { portfolioData } from '@/data/portfolio'

export default function Skills() {
  const { skills } = portfolioData

  return (
    <section id="skills" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Technical Skills</h2>
        
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Programming Languages</h3>
            <div className="flex flex-wrap gap-2">
              {skills.languages.map((skill: string) => (
                <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Frameworks & Tools</h3>
            <div className="flex flex-wrap gap-2">
              {skills.frameworks.map((skill: string) => (
                <span key={skill} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Competencies</h3>
            <div className="flex flex-wrap gap-2">
              {skills.areas.map((skill: string) => (
                <span key={skill} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Soft Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.soft.map((skill: string) => (
                <span key={skill} className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages Spoken</h3>
          <div className="flex flex-wrap gap-2">
            {skills.spoken.map((lang: string) => (
              <span key={lang} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}