import React from 'react';

const About: React.FC = () => {
    return (
        <section id="about" className="py-10">
            <div className="container mx-auto">
                <h2 className="text-3xl font-bold mb-4">About Me</h2>
                <p className="mb-4">
                    I'm Tejaswi Erattu Taj, an Informatics student at the University of Washington. I build data pipelines, web applications, and machine learning models that solve real problems.
                </p>
                <p>
                    My journey in tech began with a passion for creating impactful solutions. I have experience in developing custom WordPress plugins, training machine learning models, and teaching coding to students. I thrive on challenges and aim to deliver clean, efficient code that users can rely on.
                </p>
            </div>
        </section>
    );
};

export default About;