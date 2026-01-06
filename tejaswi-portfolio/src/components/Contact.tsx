import React from 'react';

const Contact: React.FC = () => {
    return (
        <section id="contact" className="py-10">
            <h2 className="text-2xl font-bold text-center">Contact Me</h2>
            <p className="text-center mt-2">I would love to hear from you! Please fill out the form below to get in touch.</p>
            <form className="max-w-md mx-auto mt-6">
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium">Name</label>
                    <input type="text" id="name" className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <input type="email" id="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium">Message</label>
                    <textarea id="message" className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows={4} required></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white font-bold py-2 rounded">Send Message</button>
            </form>
        </section>
    );
};

export default Contact;