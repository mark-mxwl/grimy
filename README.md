# GRIMY

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Grimy is a multimode distortion plugin built with the Web Audio API.

🔥 Accepts an audio file of up to 10 MB in the following formats: wav, aiff, and mp3.

⚡️ Audio can be triggered as a one-shot or loop, and can be replaced at any time.

🦾 Three distortion modes: Dust (Overdrive), Dirt (Crunch), and Death (Shred).

🐱‍👤 Features a built-in lowpass filter that can be toggled on or off.

👾 Drive/Cutoff can be controlled with the main knob, leveler display, or via MIDI.

> [!NOTE]
> All of Grimy's features are fully accessible with keyboard navigation.

> [!TIP]
> Connect a MIDI device to control Grimy via knobs, sliders, note velocity, etc.

## Try It 🙌

🌐 Grimy is [LIVE](https://grimy.netlify.app/) and ready for tweakage! 🌐

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

Enter `localhost:5173` (default port) into your browser, or press `o + ENTER`.

Ports, plugins, and other such things can be configured in `vite.config.js`.

## Contributing

If you'd like to lend some dev wizardry to Grimy, you can help out by opening an issue to report any bugs/odd behavior. If there's an open issue you'd like to tackle, @ me in the comments before you jump in. Thanks for getting involved! 🚀

> [!IMPORTANT]
> While I'm not currently accepting feature contributions, if you have an idea for one, fork or clone the repo and do your thing!
