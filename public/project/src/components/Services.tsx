import { Home, Building2, HardHat, Settings } from 'lucide-react';

const services = [
  {
    icon: Home,
    title: 'Residential HVAC',
    description: 'Complete heating and cooling solutions for your home. Installation, repair, and maintenance.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Building2,
    title: 'Commercial Mechanical',
    description: 'Rooftop units, VRF systems, and large-scale HVAC solutions for commercial properties.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: HardHat,
    title: 'New Construction',
    description: 'Underground rough-ins, trenching, gas lines, and foundation mechanical work for new builds.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Settings,
    title: 'Maintenance Plans',
    description: 'Preventative maintenance programs to keep your systems running efficiently year-round.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Services
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Comprehensive mechanical solutions from the ground up to the rooftop
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>

              <div className={`inline-flex p-4 bg-gradient-to-br ${service.gradient} rounded-lg mb-6`}>
                <service.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {service.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30"
          >
            Request a Quote
          </a>
        </div>
      </div>
    </section>
  );
}
