import "./assets/styles/App.css";
import ProteinDetector from "./components/ProteinDetector";

export default function App() {
  return (
    <main className="min-h-screen relative overflow-hidden font-sans">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-cyan-900 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/10 blur-3xl"></div>
            <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-l from-indigo-400/20 to-purple-400/10 blur-3xl"></div>
            <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-gradient-to-t from-teal-400/10 to-cyan-400/5 blur-3xl"></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85')] bg-cover opacity-10"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
  <div
    key={i}
    className="absolute rounded-full bg-white/10 animate-float"
    style={{
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 10 + 2}px`,
      height: `${Math.random() * 10 + 2}px`,
      animationDelay: `${Math.random() * 5}s`,
    }}
  ></div>
))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-indigo-300 drop-shadow-lg">
            Essential Protein Identification of Cancer Using Deep Learning
          </h1>

          {/* Decorative line */}
          <div className="flex justify-center mb-16">
            <div className="w-24 h-1 bg-gradient-to-r from-teal-400 to-indigo-400 rounded-full"></div>
          </div>

          <ProteinDetector />
        </div>
      </div>
    </main>
  );
}
