# TranceGen 🎵

A real-time generative trance music creator that combines Python sequencing logic with Tone.js audio synthesis. Inspired by the "Switch Angel" live coding method, this application creates endless, evolving trance music with AI-powered parameter generation.

## 🎯 Features

- **Endless Generation**: Never-ending trance music that evolves over time
- **AI Music Generation**: Ollama LLM integration for intelligent parameter generation
- **Real-time Audio**: Browser-based synthesis using Tone.js
- **State Machine**: Cycles through Groove, Breakdown, Build-up, and Drop phases
- **Interactive Controls**: Pattern library, arpeggiator modes, and reactive synthesis
- **MIDI Support**: Load and play MIDI patterns
- **Visual Feedback**: Real-time code execution log and audio visualization

## 🏗️ Architecture

- **Backend**: Python Flask + SocketIO for sequencing and musical logic
- **Frontend**: JavaScript + Tone.js for real-time audio synthesis
- **AI Integration**: Ollama LLM for generative music parameters
- **Communication**: WebSocket for real-time synchronization

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- Modern web browser (Chrome, Firefox, Edge)
- Ollama instance (optional, for AI features)

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd TranceAngel
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install flask flask-socketio requests python-dotenv
   ```

2. **Configure environment** (optional):
   ```bash
   echo "OLLAMA_URL=your-ollama-endpoint" > .env
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open browser**: Navigate to `http://localhost:5000`

## 🎛️ Controls

### Basic Controls
- **START/STOP**: Begin/end music generation
- **BPM**: Adjust tempo (120-150 BPM)
- **State**: Manual state transitions (Groove, Breakdown, Build-up, Drop)

### Pattern Library
- **Seed Patterns**: Pre-built musical patterns
- **Mutation**: Randomize existing patterns
- **MIDI Upload**: Load custom MIDI files

### AI Generation
- **Text Prompts**: Describe desired music style
- **Auto-generation**: AI creates BPM, scale, and melody parameters

### Advanced Features
- **Arpeggiator**: Multiple arp modes (Up, Down, Up-Down, Random)
- **Reactive Mode**: Audio-responsive parameter modulation
- **Instrument Toggles**: Individual control over synth layers

## 🎵 Musical Features

### Scale & Theory
- **Key**: G Minor
- **Sequencer**: 16th-note based timing
- **Melody**: "Switch Angel" motif (scale degrees 0, 4, 0, 9, 7)

### Synthesizers
- **Lead Synth**: Sawtooth with acid-style filter sweeps
- **Bass**: Super Saw with detuning and chaos factor
- **Kick**: Trance-style four-on-the-floor pattern
- **Effects**: Sidechain ducking, delay, reverb, distortion

### State Machine
1. **Groove**: Full arrangement with kick, bass, and lead
2. **Breakdown**: Isolated lead with atmospheric effects
3. **Build-up**: Rising tension with noise sweeps
4. **Drop**: Maximum energy return

## 🤖 AI Integration

The application integrates with Ollama LLMs for intelligent music generation:

- **Model**: FunctionGemma (optimized for structured JSON output)
- **Input**: Natural language descriptions ("dark atmospheric techno")
- **Output**: Musical parameters (BPM, scale notes, melody patterns)
- **Fallback**: Random generation if AI unavailable

## 🔧 Configuration

### Environment Variables (.env)
```
OLLAMA_URL=https://your-ollama-endpoint.com
```

### Audio Settings
- **BPM**: 140 (configurable 120-150)
- **Scale**: G Minor pentatonic
- **Latency**: Optimized for real-time performance

## 🎨 Technical Details

### Backend (Python)
- **Flask**: Web server and API endpoints
- **SocketIO**: Real-time WebSocket communication
- **Sequencer**: Musical timing and state management
- **AI Client**: Ollama integration for parameter generation

### Frontend (JavaScript)
- **Tone.js**: Web Audio API wrapper for synthesis
- **WebSocket**: Real-time communication with backend
- **Canvas**: Visual feedback and waveform display
- **MIDI**: File parsing and pattern loading

## 🚀 Deployment

### Production Setup
1. **Nginx Configuration**: Reverse proxy with SSL
2. **Systemd Service**: Auto-start on boot
3. **SSL Certificate**: HTTPS for audio context requirements
4. **Domain Setup**: Custom subdomain configuration

### Example Nginx Config
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🎯 Usage Examples

### Basic Usage
1. Click START to begin audio context
2. Music automatically generates and evolves
3. Use controls to influence the generation

### AI-Powered Generation
1. Enter description: "energetic uplifting trance"
2. Click Generate
3. AI creates matching musical parameters
4. Parameters applied to live generation

### MIDI Integration
1. Upload .mid file using file input
2. Pattern automatically loads and plays
3. Combines with generative elements

## 🔍 Troubleshooting

### No Audio
- Ensure browser allows audio playback
- Click START button to initialize audio context
- Check system volume and browser audio settings

### Connection Issues
- Verify Flask server is running on port 5000
- Check WebSocket connection in browser console
- Ensure no firewall blocking connections

### AI Generation Not Working
- Verify OLLAMA_URL in .env file
- Test Ollama endpoint directly
- Check service logs for error messages

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the "Switch Angel" live coding method
- Built with Tone.js for web audio synthesis
- AI integration powered by Ollama
- Trance music theory and production techniques

## 🔗 Links

- [Tone.js Documentation](https://tonejs.github.io/)
- [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
- [Ollama Documentation](https://ollama.ai/)
- [Switch Angel Video Reference](https://www.youtube.com/watch?v=iu5rnQkfO6M)
