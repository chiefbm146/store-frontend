import { Phone } from 'lucide-react';

export default function MobileCallButton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <a
        href="tel:+1234567890"
        className="flex items-center justify-center space-x-3 w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-2xl transition-colors"
      >
        <Phone className="w-6 h-6" />
        <span className="text-lg">Call Now - (123) 456-7890</span>
      </a>
    </div>
  );
}
