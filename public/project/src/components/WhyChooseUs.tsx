import { Shield, Clock, Target, Award, Users, ThumbsUp } from 'lucide-react';

const reasons = [
  {
    icon: Shield,
    title: 'Licensed & Insured',
    description: 'Full coverage and certifications for your peace of mind on every project.',
  },
  {
    icon: Clock,
    title: '24/7 Emergency Service',
    description: 'Around-the-clock availability for urgent repairs and emergency situations.',
  },
  {
    icon: Target,
    title: 'Done Right First Time',
    description: 'Precision workmanship that eliminates callbacks and ensures lasting results.',
  },
  {
    icon: Award,
    title: 'Certified Technicians',
    description: 'Highly trained professionals with industry-leading certifications and experience.',
  },
  {
    icon: Users,
    title: 'Family Owned',
    description: 'Local business committed to building lasting relationships in our community.',
  },
  {
    icon: ThumbsUp,
    title: 'Transparent Pricing',
    description: 'Clear, upfront quotes with no hidden fees or surprise charges.',
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Cuzzins Mechanical
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Excellence in every detail, from planning to execution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="flex flex-col items-start space-y-4 p-8 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <reason.icon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {reason.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who trust Cuzzins Mechanical for their projects
          </p>
          <a
            href="#contact"
            className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30"
          >
            Schedule Your Service
          </a>
        </div>
      </div>
    </section>
  );
}
