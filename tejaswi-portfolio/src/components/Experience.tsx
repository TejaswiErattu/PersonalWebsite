import React from 'react';
import { experienceData } from '../data/portfolio';

const Experience: React.FC = () => {
    return (
        <section id="experience" className="py-10">
            <h2 className="text-2xl font-bold mb-5">Experience</h2>
            <div>
                {experienceData.map((job, index) => (
                    <div key={index} className="mb-4">
                        <h3 className="text-xl font-semibold">{job.title} at {job.company}</h3>
                        <p className="text-gray-600">{job.dates}</p>
                        <ul className="list-disc list-inside">
                            {job.responsibilities.map((responsibility, idx) => (
                                <li key={idx}>{responsibility}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Experience;