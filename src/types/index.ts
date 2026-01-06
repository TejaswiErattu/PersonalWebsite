// This file defines TypeScript types and interfaces used throughout the project. 
// It helps ensure type safety in components and data structures.

export interface Project {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    link: string;
}

export interface Experience {
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
}

export interface Skill {
    name: string;
    level: string; // e.g., "Beginner", "Intermediate", "Advanced"
}

export interface ContactForm {
    name: string;
    email: string;
    message: string;
}