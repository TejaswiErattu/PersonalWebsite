import React from 'react';

const Hero: React.FC = () => {
    return (
        <section className="hero">
            <h1 className="hero-title">Tejaswi Erattu Taj</h1>
            <p className="hero-subtitle">Building data pipelines and products people use.</p>
            <div className="hero-buttons">
                <a href="#projects" className="btn">View Projects</a>
                <a href="#contact" className="btn">Contact Me</a>
            </div>
        </section>
    );
};

export default Hero;