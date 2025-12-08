import { Phone, CheckCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <img src="./images/cuzzins/492086004_3957220787870372_5534250774342681550_n.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
          <span className="text-orange-400 font-semibold">Licensed & Insured • Serving Since 2024</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Precision Mechanical
          <br />
          <span className="text-orange-500">& HVAC Solutions</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          From underground rough-ins to rooftop units. Expert mechanical services for residential and commercial projects.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <a
            href="#contact"
            className="flex items-center space-x-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-200 shadow-xl shadow-orange-500/30 text-lg"
          >
            <Phone className="w-6 h-6" />
            <span>Schedule Service</span>
          </a>
          <a
            href="#services"
            className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-lg transition-all duration-200 border border-slate-600 text-lg"
          >
            View Services
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12 text-slate-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-medium">24/7 Availability</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-medium">Certified Technicians</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-medium">Licensed & Insured</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent"></div>
    </section>
  );
}
