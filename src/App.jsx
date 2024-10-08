import React from "react";
import { useState, useEffect, useRef } from "react";
import Knob from "./components/Knob.jsx";
import DragDrop from "./components/DragDrop.jsx";
import InfoModal from "./components/InfoModal.jsx";
import "./App.css";

const ctx = new AudioContext();
const reader1 = new FileReader();
const distortion = ctx.createWaveShaper();
const filter = ctx.createBiquadFilter();

let currentBuffer;
let bufferLength;
let playBufferedSample;
let stopBufferedSample;
let loopBufferedSample;

const distortionRange = 10500;
const midiCCRange = 128;
const midiIncrement = (distortionRange / midiCCRange).toFixed(0);
let midiToFX = 5000;

let safariAgent = navigator.userAgent.indexOf("Safari") > -1;
let chromeAgent = navigator.userAgent.indexOf("Chrome") > -1;

export default function App() {
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const audioNodeIsPlaying = useRef(false);
  const [fXAmount, setFXAmount] = useState(5000);

  const [midiCC, setMidiCC] = useState(0);
  const [midiValue, setMidiValue] = useState(0);
  const [useMidi, setUseMidi] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState("");

  const [toggleFilter, setToggleFilter] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const [n, setN] = useState(0);

  const handleModal = () => setIsVisible(true);
  const handleClick = (e) => setN(e.target.value);
  const handleFilterClick = () => setToggleFilter((prev) => (prev = !prev));

  const distortionTypes = [
    {
      id: "dust",
      curve: makeDistortionCurve(curveClamp(fXAmount - 80, 200, 20)),
      oversample: "none",
      lowrange: 20,
      highrange: 200,
      filterType: "lowpass",
    },
    {
      id: "dirt",
      curve: makeDistortionCurve(curveClamp(fXAmount, 750, 100)),
      oversample: "2x",
      lowrange: 100,
      highrange: 750,
      filterType: "lowpass",
    },
    {
      id: "death",
      curve: makeDistortionCurve(curveClamp(fXAmount + 900, 10000, 1000)),
      oversample: "2x",
      lowrange: 1000,
      highrange: 10000,
      filterType: "lowpass",
    },
  ];

  filter.type = distortionTypes[n].filterType;
  filter.frequency.value = fXAmount;
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
        });
      };
    }
  }, [uploadedAudio]);

  // SOURCE NODE
  function createSourceNode() {
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

  // TOGGLE FILTER
  useEffect(() => {
    if (toggleFilter) {
      if (distortion.connect(ctx.destination)) {
        distortion.disconnect(ctx.destination);
      }
      distortion.connect(filter);
      filter.connect(ctx.destination);
    }

    if (!toggleFilter) {
      filter.disconnect(ctx.destination);
      distortion.connect(ctx.destination);
    }
  }, [toggleFilter]);

  // MIDI ACCESS
  useEffect(() => {
    discardDuplicateUserAgent();
    if (!safariAgent) {
      navigator.requestMIDIAccess().then(
        (access) => {
          access.addEventListener("statechange", findMidiDevices);
          const inputs = access.inputs;
          inputs.forEach((input) => {
            input.onmidimessage = (message) => {
              handleMidiInput(message);
            };
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
    let buttons = false;
    // MIDI note CC: 48 (PLAY), 49 (STOP), 50 (LOOP)
    if (e.data[1] === 48 && e.data[2] > 0) {
      playSample();
      buttons = true;
    }
    if (e.data[1] === 49 && e.data[2] > 0) {
      stopSample();
      buttons = true;
    }
    if (e.data[1] === 50 && e.data[2] > 0) {
      loopSample();
      buttons = true;
    }
    setMidiCC(e.data[1]);
    !buttons && setMidiValue(e.data[2]);
    !buttons && (midiToFX = e.data[2] * midiIncrement);
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
    if (audioNodeIsPlaying.current === true) {
      stopSample();
      createSourceNode();
      playBufferedSample();
      audioNodeIsPlaying.current = true;
    }
    if (audioNodeIsPlaying.current === false) {
      createSourceNode();
      playBufferedSample();
      audioNodeIsPlaying.current = true;
    }
  }

  function stopSample() {
    stopBufferedSample();
    audioNodeIsPlaying.current = false;
  }

  function loopSample() {
    createSourceNode();
    playBufferedSample();
    loopBufferedSample();
    audioNodeIsPlaying.current = true;
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
          style={{ border: !useMidi && "1px solid rgba(0, 0, 0, 0)" }}
        >
          <img
            src="icons/midi-port.svg"
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
          src="icons/universal-access-solid.svg"
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
      <div className="plugin-container-grimy">
        <h1>GRIMY</h1>
        <DragDrop uploadedAudio={setUploadedAudio} />
        <div className="plugin-drag-drop" style={{ marginTop: "25px" }}>
          <div className="plugin-control-bar">
            <div className="plugin-control-bar-L-grimy">
              <fieldset>
                <legend>Mode {">>"}</legend>
                <div title="Overdrive distortion" style={{ marginBottom: "5px" }}>
                  <input
                    type="radio"
                    id="lp"
                    name="mode"
                    value="0"
                    onClick={handleClick}
                    defaultChecked
                  />
                  <label htmlFor="lp">Dust</label>
                  <img src="icons/dust.svg" className="mode-icons" />
                </div>
                <div title="Crunch distortion" style={{ marginBottom: "5px" }}>
                  <input
                    type="radio"
                    id="hp"
                    name="mode"
                    value="1"
                    onClick={handleClick}
                  />
                  <label htmlFor="hp">Dirt</label>
                  <img src="icons/dirt.svg" className="mode-icons" />
                </div>
                <div title="Shred distortion">
                  <input
                    type="radio"
                    id="bp"
                    name="mode"
                    value="2"
                    onClick={handleClick}
                  />
                  <label htmlFor="bp">Death</label>
                  <img
                    src="icons/death.svg"
                    className="mode-icons"
                    style={{ marginLeft: "5px" }}
                  />
                </div>
              </fieldset>
            </div>
            <div className="control-bar-R-wrapper">
              <div className="plugin-control-bar-R">
                <div id="play-btn">
                  <img
                    src="icons/play-solid.svg"
                    alt="Play"
                    title="Play (MIDI CC# 48)"
                    id="play-1"
                    className="plugin-control-buttons"
                    onClick={playSample}
                    tabIndex={0}
                    onKeyDown={controlBarKeyDown}
                  />
                </div>
                <div id="stop-btn">
                  <img
                    src="icons/stop-solid.svg"
                    alt="Stop"
                    title="Stop (MIDI CC# 49)"
                    id="stop-1"
                    className="plugin-control-buttons"
                    onClick={stopSample}
                    tabIndex={0}
                    onKeyDown={controlBarKeyDown}
                  />
                </div>
                <div id="loop-btn">
                  <img
                    src="icons/repeat-solid.svg"
                    alt="Loop"
                    title="Loop (MIDI CC# 50)"
                    id="loop-1"
                    className="plugin-control-buttons"
                    onClick={loopSample}
                    tabIndex={0}
                    onKeyDown={controlBarKeyDown}
                  />
                </div>
              </div>
              <div className="control-bar-filter">
                {"@"} Filter{" "}
                <a
                  title="Filter On"
                  onClick={handleFilterClick}
                  style={{
                    color: !toggleFilter && "gray",
                    filter: !toggleFilter && "none",
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleFilterClick();
                    }
                  }}
                >
                  On
                </a>
                {" | "}
                <a
                  title="Filter Off"
                  onClick={handleFilterClick}
                  style={{
                    color: toggleFilter && "gray",
                    filter: toggleFilter && "none",
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleFilterClick();
                    }
                  }}
                >
                  Off
                </a>
              </div>
            </div>
          </div>
        </div>
        <Knob setFXAmount={setFXAmount} midiToFX={midiToFX} />
      </div>
    </>
  );
}
