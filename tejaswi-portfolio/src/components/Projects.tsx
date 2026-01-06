import React from 'react';
import { projects } from '../data/portfolio';

const Projects: React.FC = () => {
    return (
        <section id="projects" className="py-10">
            <h2 className="text-3xl font-bold text-center">Projects</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 shadow-md">
                        <h3 className="text-xl font-semibold">{project.title}</h3>
                        <p className="mt-2">{project.description}</p>
                        <a href={project.link} className="text-blue-500 hover:underline mt-4 block">
                            View Case Study
                        </a>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;