import { useRef, useState, useEffect } from "react";

export default function Knob(props) {
  const {
    setDistortionAmount,
    setFilterFreq,
    midiToFX,
    distortionTypes,
    index,
  } = props;

  const componentIsMounted = useRef(false);

  const knobRef = useRef();
  const pointerRef = useRef();
  const currentValueRef = useRef(5000);
  const [keyInput, setKeyInput] = useState("");

  let center = 0;
  let distance;
  let mouseIsDown = false;
  let mouseIsMoving = false;

  useEffect(() => {
    componentIsMounted.current = true;
    componentIsMounted.current && mountKnob();

    return () => {
      componentIsMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (midiToFX) {
      distance = distClamp(midiToFX - 5000, 5000, -4900);
      setDistortionAmount(distance + 5000);
      setFilterFreq(distance + 5000);
      knobRef.current.style.transform = "rotate(" + distance / 32 + "deg)";
      currentValueRef.current = distance + 5000;
    }
  }, [midiToFX]);

  useEffect(() => {
    if (keyInput) {
      distance = distClamp(keyInput - 5000, 5000, -4900);
      setDistortionAmount(distance + 5000);
      setFilterFreq(distance + 5000);
      knobRef.current.style.transform = "rotate(" + distance / 32 + "deg)";
      currentValueRef.current = distance + 5000;
    }
  }, [keyInput]);

  function handleKeyInput(e) {
    // For typed values
    const isNumber = isFinite(e.key);
    if (isNumber) {
      setKeyInput((prev) => Number(prev + e.key));
    }

    // For arrow values
    let arrowIncrement = 180;
    if (e.key === "ArrowUp") {
      setKeyInput((prev) => Number(prev + arrowIncrement));
    }
    if (e.key === "ArrowDown") {
      setKeyInput((prev) => Number(prev - arrowIncrement));
    }
  }

  function distClamp(value, max, min) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
  }

  function mountKnob() {
    knobRef.current.addEventListener("mousedown", (e) => {
      center = e.pageY;
      mouseIsDown = true;
    });

    document.body.addEventListener("mouseup", (e) => {
      mouseIsDown = false;
    });

    knobRef.current.addEventListener("mouseenter", (e) => {
      if (mouseIsDown) {
        mouseIsMoving = true;
      }
    });

    document.body.addEventListener("mousemove", (e) => {
      mouseIsMoving = true;
      if (mouseIsDown && mouseIsMoving) {
        distance = distClamp((center - e.pageY) * 38, 5000, -4900);
        knobRef.current.style.transform = "rotate(" + distance / 32 + "deg)";
        currentValueRef.current = distance + 5000;
        setDistortionAmount(distance + 5000);
        setFilterFreq(distance + 5000);
      }
    });

    knobRef.current.addEventListener("dblclick", (e) => {
      knobRef.current.style.transform = "rotate(0deg)";
      currentValueRef.current = 5000;
      setDistortionAmount(5000);
      setFilterFreq(5000);
      setKeyInput("");
    });

    currentValueRef.current.addEventListener("dblclick", (e) => {
      knobRef.current.style.transform = "rotate(0deg)";
      currentValueRef.current = 5000;
      setDistortionAmount(5000);
      setFilterFreq(5000);
      setKeyInput("");
    });

    currentValueRef.current.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        knobRef.current.style.transform = "rotate(0deg)";
        currentValueRef.current = 5000;
        setDistortionAmount(5000);
        setFilterFreq(5000);
        setKeyInput("");
      }
    });
  }

  return (
    <>
      <div className="wrapper">
        <div className="knob">
          <div className="label label-l">Grit</div>
          <div className="knob_inner_shadow">
            <div
              ref={knobRef}
              className="knob_inner"
              title="Drive: double-click to reset!"
            >
              <div ref={pointerRef} className="knob_inner_pointer"></div>
            </div>
          </div>
          <div className="label label-r">Grime</div>
        </div>
        <div
          title="Amount: double-click to reset!"
          ref={currentValueRef}
          className="current-value"
          tabIndex={0}
          onKeyDown={handleKeyInput}
        >
          <div className="wavefont-cv">{currentValueRef.current}</div>
          {/* {keyInput ? `${distClamp(keyInput, 10000, 100)}` : 5000} */}
        </div>
      </div>
    </>
  );
}