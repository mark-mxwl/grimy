# GRIMY

### Grimy is a multimode distortion plugin built with the Web Audio API.

🔥 Trigger audio samples as a one-shot or loop, and swap out at any time.

⚡️ Three distortion modes: Dust (Overdrive), Dirt (Crunch), and Death (Shred).

🦾 Includes a built-in lowpass filter with a bypass option.

👾 Drive/Cutoff can be controlled via MIDI, mouse/trackpad, or keyboard.

> [!NOTE]
> All of Grimy's features are fully accessible with keyboard navigation.

> [!TIP]
> Connect a MIDI device to control Grimy via knobs, sliders, note velocity, etc.

## Try It 🙌

🌐 Grimy is [LIVE](https://erratic-audio.com/grimy) and ready for tweakage! 🌐

### Browser Compatibility

🔈 Grimy's audio features are compatible with all major browers: Chrome, Safari, Firefox, etc.

🎛 Firefox will request access to your MIDI devices. If your device fails to connect, try refreshing the page.

> [!WARNING]
> Safari does not support Web MIDI; features are disabled.

## Project Setup

Clone the repository to your local machine.

```
git clone https://github.com/mark-mxwl/grimy.git
```

Navigate to the root directory and install dependencies.

```
npm install
```

## Development

Run the Vite development server.

```
npm run dev
```

Enter `localhost:5001` into your browser, or press `o + ENTER`.

Ports, plugins, and other such things can be configured in `vite.config.js`.
