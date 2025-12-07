import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Gallery from './components/Gallery';
import WhyChooseUs from './components/WhyChooseUs';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import MobileCallButton from './components/MobileCallButton';

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <Hero />
      <Services />
      <Gallery />
      <WhyChooseUs />
      <ContactForm />
      <Footer />
      <MobileCallButton />

      <div id="ai-chat-widget-placeholder" className="fixed bottom-24 right-6 z-40 md:bottom-6">
      </div>
    </div>
  );
}

export default App;
