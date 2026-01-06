import { portfolioData } from '@/data/portfolio'
import { ExternalLink, Github } from 'lucide-react'

export default function Projects() {
  const { projects } = portfolioData

  return (
    <section id="projects" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Selected Projects</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto text-base md:text-lg">
          Systems I've built for real users and organizations.
        </p>
        
        <div className="space-y-8">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tech.map((tech: string) => (
                  <span key={tech} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">What I Built</h4>
                  <ul className="space-y-2">
                    {project.solution.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700 flex items-start text-sm md:text-base">
                        <span className="text-blue-600 mr-3 mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Impact</p>
                  <p className="text-gray-700 text-sm md:text-base">{project.impact}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">What I Learned</h4>
                  <p className="text-gray-700 text-sm md:text-base">{project.learned}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                <a 
                  href={project.github}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <Github size={18} />
                  <span>View Code</span>
                </a>
                {project.demo !== '#' && (
                  <a 
                    href={project.demo}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    <ExternalLink size={18} />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}