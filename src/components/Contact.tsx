import { portfolioData } from '@/data/portfolio'
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react'

export default function Contact() {
  const { personal } = portfolioData

  return (
    <section id="contact" className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Let's Connect</h2>
        <p className="text-base md:text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          I'm looking for summer 2026 software engineering internships where I solve complex problems and ship impactful products.
        </p>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <a 
              href={`mailto:${personal.email}`}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <Mail size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Email</p>
                <p className="text-gray-900">{personal.email}</p>
              </div>
            </a>
            
            <a 
              href="tel:+14258004330"
              className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <Phone size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone</p>
                <p className="text-gray-900">{personal.phone}</p>
              </div>
            </a>

            <a 
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <Linkedin size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 font-medium">LinkedIn</p>
                <p className="text-gray-900 text-sm">View Profile</p>
              </div>
            </a>

            <a 
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <Github size={20} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 font-medium">GitHub</p>
                <p className="text-gray-900 text-sm">View Repositories</p>
              </div>
            </a>
          </div>

          <div className="flex items-center justify-center space-x-3 mb-8 p-4 bg-white rounded-lg">
            <MapPin size={20} className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Location</p>
              <p className="text-gray-900">{personal.location}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Open to roles in:</span> Data engineering, Full-stack development, Machine learning, Education technology
            </p>
            <p className="text-sm text-gray-600">
              Available for internships starting May 2026 · Onsite, hybrid, or remote
            </p>
          </div>
          
          <div className="flex justify-center">
            <a 
              href={`mailto:${personal.email}`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105 text-center"
            >
              Email Me
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}