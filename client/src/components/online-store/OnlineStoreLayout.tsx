import { ReactNode } from "react";

interface OnlineStoreLayoutProps {
  children: ReactNode;
}

export default function OnlineStoreLayout({ children }: OnlineStoreLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PrintSphere</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#services" className="text-gray-600 hover:text-gray-900">Services</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">PrintSphere</h3>
              <p className="text-gray-300">Your trusted partner for all printing needs.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li>Document Printing</li>
                <li>Large Format Printing</li>
                <li>ID Photo Services</li>
                <li>Lamination</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="text-gray-300 space-y-2">
                <p>Phone: (555) 123-4567</p>
                <p>Email: info@printsphere.com</p>
                <p>Address: 123 Print St, City, State</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Hours</h3>
              <div className="text-gray-300 space-y-2">
                <p>Mon-Fri: 8:00 AM - 8:00 PM</p>
                <p>Saturday: 9:00 AM - 6:00 PM</p>
                <p>Sunday: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">&copy; 2023 PrintSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}