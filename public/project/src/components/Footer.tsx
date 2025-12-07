import { Wrench, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Wrench className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold text-white">Cuzzins Mechanical</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Professional mechanical and HVAC services for residential and commercial projects.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-slate-400">
                <Phone className="w-5 h-5 text-orange-500" />
                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <Mail className="w-5 h-5 text-orange-500" />
                <a href="mailto:info@cuzzinsmechanical.com" className="hover:text-white transition-colors">
                  info@cuzzinsmechanical.com
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Services</h3>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-slate-400 hover:text-white transition-colors">
                  Residential HVAC
                </a>
              </li>
              <li>
                <a href="#services" className="text-slate-400 hover:text-white transition-colors">
                  Commercial Mechanical
                </a>
              </li>
              <li>
                <a href="#services" className="text-slate-400 hover:text-white transition-colors">
                  New Construction
                </a>
              </li>
              <li>
                <a href="#services" className="text-slate-400 hover:text-white transition-colors">
                  Maintenance Plans
                </a>
              </li>
              <li>
                <a href="#contact" className="text-slate-400 hover:text-white transition-colors">
                  Emergency Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-slate-400 hover:text-white transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#projects" className="text-slate-400 hover:text-white transition-colors">
                  Recent Projects
                </a>
              </li>
              <li>
                <a href="#why-us" className="text-slate-400 hover:text-white transition-colors">
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Service Areas</h3>
            <div className="flex items-start space-x-3 text-slate-400 mb-4">
              <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <p className="leading-relaxed">
                Serving the Greater Metropolitan Area and surrounding counties
              </p>
            </div>
            <a
              href="#contact"
              className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30 mt-4"
            >
              Request Emergency Service
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © {currentYear} Cuzzins Mechanical. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
