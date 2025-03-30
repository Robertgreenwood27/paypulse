// src/components/layout/Footer.js
export default function Footer() {
    return (
      <footer className="bg-gray-800 p-4 mt-8">
        <div className="container mx-auto text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} PayPulse. All rights reserved.
        </div>
      </footer>
    );
  }