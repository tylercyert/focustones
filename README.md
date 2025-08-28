# FocusTones.co

**Professional Binaural Beat Generator for Deep Work & Focus**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

## 🌟 What is FocusTones.co?

FocusTones.co is a sophisticated web application that generates customizable binaural tones to guide your brain into optimal states for focus, creativity, and deep work. Built with cutting-edge web technologies, it provides a seamless, professional-grade experience for anyone seeking to enhance their cognitive performance through sound therapy.

## 🧠 How Binaural Beats Work

Binaural beats work by presenting two slightly different frequencies to each ear, creating a third "beat" frequency in your brain. This process, known as **brainwave entrainment**, gently nudges your brainwaves into specific frequency ranges that correspond to different mental states:

- **Delta (0.5–4 Hz)**: Deep sleep, restoration, and healing
- **Theta (4–8 Hz)**: Relaxation, meditation, and heightened creativity  
- **Alpha (8–12 Hz)**: Calm, present awareness — ideal for light focus and flow
- **Beta (12–30 Hz)**: Active thinking, problem-solving, and alertness
- **Gamma (30+ Hz)**: High-level cognition, memory, and peak concentration

## ✨ Key Features

### 🎵 **Advanced Audio Engine**
- **Real-time Generation**: Instant binaural beat creation with zero latency
- **Smooth Transitions**: 1-second fade-in/out for seamless audio experience
- **Stereo Panning**: Authentic binaural effect with left/right channel separation
- **Volume Control**: Precise audio level management (0-100%)

### 🎛️ **Professional Controls**
- **Brainwave Band Selection**: Choose from 5 scientifically-proven frequency ranges
- **Carrier Frequency**: Adjustable base tone (80Hz - 1000Hz) for optimal comfort
- **Offset Tuning**: Fine-tune the beat frequency within each band's range
- **Settings Persistence**: Your preferences are automatically saved and restored

### 🌊 **Enhanced Audio Experience**
- **White Noise Overlay**: Optional background noise with volume control
- **Low-Pass Filtering**: Customizable frequency filtering (500Hz - 8kHz)
- **Synchronized Playback**: White noise automatically syncs with binaural beats

### 🎨 **Immersive Visualization**
- **3D Sphere Interface**: Interactive Three.js visualization with real-time animation
- **Dynamic Color Coding**: Visual feedback that adapts to your selected brainwave band
- **Responsive Design**: Optimized for all devices and screen sizes
- **Click-to-Toggle**: Simple one-click play/pause control

## 🚀 Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + Material Design 3
- **3D Graphics**: Three.js with custom GLSL shaders
- **Audio**: Web Audio API with advanced oscillator management
- **State Management**: Zustand for efficient global state
- **Deployment**: Docker + Nginx for production-ready hosting

## 🎯 Use Cases

### **Deep Work & Productivity**
- **Focus Sessions**: Use Beta or Gamma frequencies for intense concentration
- **Creative Work**: Theta frequencies for enhanced creativity and ideation
- **Learning**: Alpha frequencies for optimal information absorption
- **Problem Solving**: Beta frequencies for analytical thinking

### **Wellness & Recovery**
- **Meditation**: Theta frequencies for deep relaxation
- **Sleep Preparation**: Delta frequencies for natural sleep induction
- **Stress Relief**: Alpha frequencies for calm, centered awareness
- **Recovery**: Delta frequencies for physical and mental restoration

## 🏗️ Architecture

FocusTones.co is built with a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Audio Engine  │    │   3D Renderer   │
│   Components    │◄──►│   Web Audio API │◄──►│   Three.js      │
│   State Mgmt    │    │   Oscillators   │    │   GLSL Shaders  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   LocalStorage  │
                    │   Persistence   │
                    └─────────────────┘
```

## 🚀 Getting Started

### **Quick Start (Development)**
```bash
# Clone the repository
git clone https://github.com/yourusername/focustones.git
cd focustones

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### **Production Deployment**
```bash
# Build for production
npm run build

# Docker deployment
docker build -t focustones:latest .
docker run -d -p 3000:80 focustones:latest

# Or use Docker Compose
docker-compose up -d
```

## 📱 Browser Compatibility

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+ ✅

## 🔧 Configuration

### **Environment Variables**
```bash
NODE_ENV=production
PORT=3000
```

### **Nginx Configuration**
The included `nginx.conf` provides:
- Gzip compression
- Security headers
- SPA routing support
- Static asset caching
- Health check endpoint

## 📊 Performance Metrics

- **Bundle Size**: 697.12 kB (gzipped: 187.08 kB)
- **Build Time**: ~1 second
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <2.5s
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)

## 🛡️ Security Features

- **Content Security Policy**: XSS protection
- **X-Frame-Options**: Clickjacking prevention
- **X-Content-Type-Options**: MIME type sniffing protection
- **Referrer Policy**: Privacy-focused referrer handling
- **HTTPS Ready**: Secure deployment configuration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Install development dependencies
npm install

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js**: 3D graphics library
- **Web Audio API**: Audio processing capabilities
- **Material Design**: UI/UX design system
- **Tailwind CSS**: Utility-first CSS framework

## 📞 Support

- **Website**: [focustones.com](https://focustones.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/focustones/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/focustones/wiki)

## 🌟 About the Creator

FocusTones.co was created by **Tyler Cyert** to support deep work practices and cognitive enhancement. Built with passion for both technology and human performance optimization.

**Learn more**: [tylercyert.com](https://tylercyert.com)

---

<div align="center">

**Ready to unlock your cognitive potential?** 🚀

[Try FocusTones.co Now](https://focustones.com)

*Professional-grade binaural beats for the modern mind*

</div>
