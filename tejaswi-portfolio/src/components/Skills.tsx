import React from 'react';

const Skills: React.FC = () => {
    return (
        <section id="skills" className="py-10">
            <h2 className="text-2xl font-bold mb-4">Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold">Programming Languages</h3>
                    <ul className="list-disc pl-5">
                        <li>Python</li>
                        <li>Java</li>
                        <li>JavaScript</li>
                        <li>PHP</li>
                        <li>HTML</li>
                        <li>CSS</li>
                        <li>SQL</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold">Frameworks & Tools</h3>
                    <ul className="list-disc pl-5">
                        <li>React</li>
                        <li>WordPress</li>
                        <li>Power BI</li>
                        <li>Git</li>
                        <li>MySQL</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold">Soft Skills</h3>
                    <ul className="list-disc pl-5">
                        <li>Teaching</li>
                        <li>Team Leadership</li>
                        <li>Technical Communication</li>
                        <li>Project Management</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold">Languages Spoken</h3>
                    <ul className="list-disc pl-5">
                        <li>English (fluent)</li>
                        <li>Malayalam (native)</li>
                        <li>Spanish (elementary)</li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default Skills;