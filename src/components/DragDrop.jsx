import { useState, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["wav", "aiff", "mp3"];

function DragDrop(props) {
  const [audioFile, setAudioFile] = useState(null);
  const handleChange = (file) => {
    sessionStorage.setItem("grimyAudio", file.name);
    const data = sessionStorage.getItem("grimyAudio");
    setAudioFile(data);
    props.uploadedAudio(file);
  };
  const [sizeErrorText, setSizeErrorText] = useState("")
  const fileSizeTooBig = () => setSizeErrorText("File size exceeds 100MB!");
  const fileNameWithSpaces = audioFile?.split("_").join(" ");

  const dStyles = {
    width: "60vw",
    minWidth: "285px",
    maxWidth: "500px",
    height: "90px",
    margin: "-5px auto 0 auto",
    padding: ".01em 15px 1rem 15px",
    border: "none",
    borderRadius: "20px",
    backgroundColor: "#242424",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
  };

  const pStyles = {
    font: ".8rem Inconsolata, monospace",
    color: "rgba(255, 255, 255, .9)",
    margin: "10px 0 0 0",
  }

  useEffect(() => {
    if (sessionStorage.getItem("grimyAudio")) {
      const data = sessionStorage.getItem("grimyAudio");
      setAudioFile(data);
    }
  }, []);

  window.addEventListener("beforeunload", function(e) {
    sessionStorage.removeItem("grimyAudio");
  }); 


  return (
    <>
      <div title="File selector" className="plugin-drag-drop">
        <FileUploader
          handleChange={handleChange}
          name={audioFile}
          types={fileTypes}
          multiple={false}
          label="Drop or select audio!"
          children={
            audioFile ? (
              <div style={dStyles}>
                <p style={pStyles}>
                  <b>{fileNameWithSpaces}</b> uploaded successfully!
                </p>
                <p style={pStyles}>
                  {">>"} Drop or <u>select</u> audio to replace!
                </p>
              </div>
            ) : (
              <div style={dStyles}>
                <p style={pStyles}>
                  {">>"} <b>Drop</b> or <u>select</u> audio // 100MB limit
                </p>
                <p style={pStyles}>
                  {sizeErrorText}
                </p>
              </div>
            )
          }
          array={["wav", "aiff", "mp3"]}
          maxSize={100}
          onSizeError={fileSizeTooBig}
        />
      </div>
    </>
  );
}

export default DragDrop;
