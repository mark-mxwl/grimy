import { useState, useEffect } from "react";
import Knob from "./components/Knob.jsx";
import DragDrop from "./components/DragDrop.jsx";
import InfoModal from "./components/InfoModal.jsx";

const ctx = new AudioContext();
const reader1 = new FileReader();
const distortion = ctx.createWaveShaper();
const filter = ctx.createBiquadFilter();
distortion.connect(filter);
filter.connect(ctx.destination);

let currentBuffer;
let bufferLength;
let playBufferedSample;
let stopBufferedSample;
let loopBufferedSample;

const distortionRange = 10500;
const midiCCRange = 128;
const midiIncrement = (distortionRange / midiCCRange).toFixed(0);
let midiToFX = 5000;

let n = 0;

let safariAgent = navigator.userAgent.indexOf("Safari") > -1;
let chromeAgent = navigator.userAgent.indexOf("Chrome") > -1;

export default function App() {
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const [bufferReady, setBufferReady] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(5000);
  const [filterFreq, setFilterFreq] = useState(5000);

  const [midiCC, setMidiCC] = useState(0);
  const [midiValue, setMidiValue] = useState(0);
  const [useMidi, setUseMidi] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState("");

  const [toggle, setToggle] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleModal = () => setIsVisible(true);
  const handleClick = (e) => (n = e.target.value);

  const distortionTypes = [
    {
      id: "dust",
      curve: makeDistortionCurve(curveClamp(distortionAmount - 80, 200, 20)),
      oversample: "none",
      lowrange: 20,
      highrange: 200,
      filterType: "lowpass",
    },
    {
      id: "dirt",
      curve: makeDistortionCurve(curveClamp(distortionAmount, 750, 100)),
      oversample: "2x",
      lowrange: 100,
      highrange: 750,
      filterType: "lowpass",
    },
    {
      id: "death",
      curve: makeDistortionCurve(
        curveClamp(distortionAmount + 900, 10000, 1000)
      ),
      oversample: "2x",
      lowrange: 1000,
      highrange: 10000,
      filterType: "lowpass",
    },
  ];

  filter.type = distortionTypes[n].filterType;
  filter.frequency.value = filterFreq;
  distortion.curve = distortionTypes[n].curve;
  distortion.oversample = distortionTypes[n].oversample;

  function curveClamp(value, max, min) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
  }

  function makeDistortionCurve(amount) {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; i++) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  function discardDuplicateUserAgent() {
    if (chromeAgent && safariAgent) safariAgent = false;
  }

  // AUDIO BUFFER
  useEffect(() => {
    if (uploadedAudio) {
      reader1.readAsArrayBuffer(uploadedAudio);
      reader1.onload = function (e) {
        ctx.decodeAudioData(e.target.result).then(function (buffer) {
          currentBuffer = buffer;
          setBufferReady(true);
          setToggle((prev) => (prev = !prev));
        });
      };
    }
  }, [uploadedAudio]);

  // SOURCE NODE
  useEffect(() => {
    if (bufferReady) {
      const soundSource = ctx.createBufferSource();
      soundSource.buffer = currentBuffer;
      soundSource.connect(distortion);
      playBufferedSample = () => soundSource.start();
      stopBufferedSample = () => soundSource.stop();
      loopBufferedSample = () => {
        soundSource.loop = true;
        soundSource.loopEnd = currentBuffer.duration;
      };
      bufferLength = Number(soundSource.buffer.duration.toFixed(0) * 1000);
    }
  }, [toggle]);

  // MIDI ACCESS
  useEffect(() => {
    discardDuplicateUserAgent();
    if (!safariAgent) {
      navigator.requestMIDIAccess().then(
        (access) => {
          access.addEventListener("statechange", findMidiDevices);
          const inputs = access.inputs;
          inputs.forEach((input) => {
            input.addEventListener("midimessage", handleMidiInput);
          });
        },
        (fail) => {
          console.log(`Could not connect to MIDI. Error: ${fail}`);
        }
      );
    }
  }, []);

  function findMidiDevices(e) {
    if (e.port.state === "disconnected") {
      setMidiDeviceName("No device detected");
    } else if (e.port.state === "connected") {
      setMidiDeviceName(e.port.name);
    }
  }

  function handleMidiInput(e) {
    setMidiCC(e.data[1]);
    setMidiValue(e.data[2]);
    midiToFX = e.data[2] * midiIncrement;
  }

  function handleMidiClick() {
    setUseMidi((prev) => (prev = !prev));
  }

  function controlBarKeyDown(e) {
    if (e.key === "Enter" && e.target.id === "play-1") {
      playSample();
    }
    if (e.key === "Enter" && e.target.id === "stop-1") {
      stopSample();
    }
    if (e.key === "Enter" && e.target.id === "loop-1") {
      loopSample();
    }
  }

  function playSample() {
    ctx.resume();
    playBufferedSample();
    setTimeout(suspendContext, bufferLength);
  }

  function stopSample() {
    stopBufferedSample();
    suspendContext();
  }

  function loopSample() {
    ctx.resume();
    playBufferedSample();
    loopBufferedSample();
  }

  function suspendContext() {
    ctx.suspend();
    setToggle((prev) => (prev = !prev));
  }

  return (
    <>
      <InfoModal
        isVisible={isVisible}
        toggleModal={() => setIsVisible(false)}
      />
      <div className="midi-and-accessibility">
        <div
          className="midi"
          style={{ border: !useMidi && "1px solid rgba(165, 165, 165, 0)" }}
        >
          <img
            src="icon/midi-port.svg"
            className="link-icons"
            alt="MIDI"
            title="MIDI"
            onClick={handleMidiClick}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleMidiClick();
              }
            }}
            style={{
              filter:
                useMidi &&
                "invert(75%) sepia(61%) saturate(411%) \
                hue-rotate(353deg) brightness(101%) contrast(101%)",
              cursor: "pointer",
            }}
          />
          <p style={{ display: !useMidi && "none" }}>
            {safariAgent
              ? "Safari does not support Web MIDI."
              : `MIDI: ${midiDeviceName} | CC#: ${midiCC} | Value: ${
                  midiValue === undefined ? 0 : midiValue
                }`}
          </p>
        </div>
        <img
          src="icon/universal-access-solid.svg"
          alt="Universal Access"
          title="Universal Access"
          className="link-icons"
          onClick={handleModal}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsVisible(true);
            }
            if (e.key === "Escape") {
              setIsVisible(false);
            }
          }}
          style={{ cursor: "pointer" }}
        />
      </div>
      <div className="plugin-container">
        <h1>GRIMY</h1>
        <DragDrop uploadedAudio={setUploadedAudio} />
        <div className="plugin-drag-drop" style={{ marginTop: "25px" }}>
          <div className="plugin-control-bar">
            <div className="plugin-control-bar-L">
              <fieldset>
                <legend>Mode {">>"}</legend>
                <div title="Light Distortion">
                  <input
                    type="radio"
                    id="lp"
                    name="mode"
                    value="0"
                    onClick={handleClick}
                    defaultChecked
                  />
                  <label htmlFor="lp">Dust</label>
                  {/* <div className="filter-icon-wrapper">
                    <img
                      src="icon/filter-lowpass.svg"
                      className="filter-icons"
                    />
                  </div> */}
                </div>
                <div title="Mid Distortion">
                  <input
                    type="radio"
                    id="hp"
                    name="mode"
                    value="1"
                    onClick={handleClick}
                  />
                  <label htmlFor="hp">Dirt</label>
                  {/* <div className="filter-icon-wrapper">
                    <img
                      src="icon/filter-lowpass.svg"
                      className="filter-icons flip-hztl"
                    />
                  </div> */}
                </div>
                <div title="Heavy Distortion">
                  <input
                    type="radio"
                    id="bp"
                    name="mode"
                    value="2"
                    onClick={handleClick}
                  />
                  <label htmlFor="bp">Death</label>
                  {/* <div className="filter-icon-wrapper">
                    <img
                      src="icon/filter-notch.svg"
                      className="filter-icons flip-vrtl"
                    />
                  </div> */}
                </div>
              </fieldset>
            </div>
            <div className="plugin-control-bar-R">
              <div id="play-btn">
                <img
                  src="icon/play-solid.svg"
                  alt="Play"
                  title="Play"
                  id="play-1"
                  className="plugin-control-buttons"
                  onClick={playSample}
                  tabIndex={0}
                  onKeyDown={controlBarKeyDown}
                />
              </div>
              <div id="stop-btn">
                <img
                  src="icon/stop-solid.svg"
                  alt="Stop"
                  title="Stop"
                  id="stop-1"
                  className="plugin-control-buttons"
                  onClick={stopSample}
                  tabIndex={0}
                  onKeyDown={controlBarKeyDown}
                />
              </div>
              <div id="loop-btn">
                <img
                  src="icon/repeat-solid.svg"
                  alt="Loop"
                  title="Loop"
                  id="loop-1"
                  className="plugin-control-buttons"
                  onClick={loopSample}
                  tabIndex={0}
                  onKeyDown={controlBarKeyDown}
                />
              </div>
            </div>
          </div>
        </div>
        <Knob
          setDistortionAmount={setDistortionAmount}
          midiToFX={midiToFX}
          distortionTypes={distortionTypes}
          setFilterFreq={setFilterFreq}
          index={n}
        />
      </div>
      <div className="copyright-and-links">
        <p style={{ marginLeft: "9px" }}>MIT 2024 © Mark Maxwell</p>
        <div>
          <a href="https://github.com/mark-mxwl" target="_blank">
            <img
              src="icon/github.svg"
              alt="GitHub"
              title="GitHub"
              className="link-icons"
            />
          </a>
          <a href="https://markmaxwelldev.com" target="_blank">
            <img
              src="icon/M_nav_icon_1.svg"
              alt="Website"
              title="Website"
              className="link-icons"
            />
          </a>
        </div>
      </div>
    </>
  );
}