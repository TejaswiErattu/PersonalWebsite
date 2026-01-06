import { portfolioData } from '@/data/portfolio'

export default function About() {
  const { personal } = portfolioData

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">About Me</h2>
        
        <div className="space-y-6 text-base md:text-lg leading-relaxed">
          <p className="text-gray-700">
            I build data infrastructure and web applications that solve real problems.
          </p>
          
          <p className="text-gray-700">
            At Kerala Association of Washington, I migrated 2,800+ member records into a production WordPress system. I wrote custom PHP plugins for data imports, user management, and automated backups. The system runs live today.
          </p>
          
          <p className="text-gray-700">
            At Cyber Minds Nonprofit, I deployed a chatbot handling 100+ monthly user inquiries and led a 5-person team building an ML-powered cybersecurity course. At Apollo AI, I trained machine learning models for an educational platform supporting 50+ K-12 students.
          </p>
          
          <p className="text-gray-700">
            I've also spent two years teaching coding to 60+ elementary and middle school students. Teaching forces clarity. You learn what you truly understand when you explain binary search to a 10-year-old.
          </p>
          
          <p className="text-gray-900 font-medium">
            I'm looking for summer 2026 software engineering internships where I solve hard problems, work with strong teams, and ship products that matter.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 md:p-8 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <span className="font-medium text-gray-900">Location:</span> {personal.location}
              </div>
              <div>
                <span className="font-medium text-gray-900">Education:</span> {personal.university}
              </div>
              <div>
                <span className="font-medium text-gray-900">Major:</span> {personal.major} ({personal.years})
              </div>
              <div>
                <span className="font-medium text-gray-900">Languages:</span> English, Malayalam, Spanish
              </div>
            </div>
            <div className="mt-4">
              <span className="font-medium text-gray-900">Interests:</span> Data infrastructure, machine learning, education technology
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}