const projects = [
  {
    title: 'Underground Rough-In',
    category: 'New Construction',
    image: './images/cuzzins/481054285_3902256753366776_4108173069898691919_n.jpg',
  },
  {
    title: 'Commercial HVAC Install',
    category: 'Commercial',
    image: './images/cuzzins/492367007_3958266844432433_4776578623748122226_n.jpg',
  },
  {
    title: 'Trenching & Gas Lines',
    category: 'Site Work',
    image: './images/cuzzins/496947888_3980452578880526_139332101137315520_n.jpg',
  },
  {
    title: 'Residential Installation',
    category: 'Residential',
    image: './images/cuzzins/497934226_3980452588880525_2660420337153911252_n.jpg',
  },
  {
    title: 'Foundation Mechanical',
    category: 'New Construction',
    image: './images/cuzzins/498594254_3980452595547191_1143407498091202096_n.jpg',
  },
  {
    title: 'Rooftop Unit Service',
    category: 'Commercial',
    image: './images/cuzzins/498632555_3980452605547190_1847504795826369628_n.jpg',
  },
];

export default function Gallery() {
  return (
    <section id="projects" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Recent Projects
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See our work on the ground and in action
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-slate-800 aspect-[4/3] cursor-pointer"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full mb-2">
                  {project.category}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {project.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
