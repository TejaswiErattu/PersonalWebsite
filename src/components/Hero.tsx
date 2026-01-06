import { portfolioData } from '@/data/portfolio'
import { Mail, Github, Linkedin } from 'lucide-react'

export default function Hero() {
  const { personal, hero, quickProof } = portfolioData

  return (
    <section id="hero" className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            {personal.name}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            {hero.headline}
          </p>
          <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {hero.subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              View My Work
            </button>
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Get In Touch
            </button>
          </div>

          <div className="flex justify-center space-x-6 mb-12">
            <a href={`mailto:${personal.email}`} className="text-gray-600 hover:text-gray-900 transition-colors" title="Email">
              <Mail size={24} />
            </a>
            <a href={personal.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors" title="GitHub">
              <Github size={24} />
            </a>
            <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors" title="LinkedIn">
              <Linkedin size={24} />
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center mb-6">Highlights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickProof.map((proof, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 px-4 py-3 rounded-lg text-center">
                <p className="text-gray-900 font-medium text-sm md:text-base">{proof}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}