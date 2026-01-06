import { portfolioData } from '@/data/portfolio'

export default function Footer() {
  const { personal } = portfolioData

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-400 text-sm md:text-base">
          © 2026 {personal.name} · Built with Next.js and Tailwind CSS
        </p>
      </div>
    </footer>
  )
}