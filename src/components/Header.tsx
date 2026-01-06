import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsOpen(false)
  }

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button 
            onClick={() => scrollTo('hero')}
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            Tejaswi Erattu Taj
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollTo('about')} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">About</button>
            <button onClick={() => scrollTo('projects')} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Projects</button>
            <button onClick={() => scrollTo('experience')} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Experience</button>
            <button onClick={() => scrollTo('contact')} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Contact</button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col space-y-4">
              <button onClick={() => scrollTo('about')} className="text-gray-600 hover:text-blue-600 transition-colors text-left font-medium py-2">About</button>
              <button onClick={() => scrollTo('projects')} className="text-gray-600 hover:text-blue-600 transition-colors text-left font-medium py-2">Projects</button>
              <button onClick={() => scrollTo('experience')} className="text-gray-600 hover:text-blue-600 transition-colors text-left font-medium py-2">Experience</button>
              <button onClick={() => scrollTo('contact')} className="text-gray-600 hover:text-blue-600 transition-colors text-left font-medium py-2">Contact</button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}