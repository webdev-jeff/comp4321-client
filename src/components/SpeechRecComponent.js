import React, { Component } from "react";
import { Button } from "reactstrap";

var recognizing = false;

class SpeechRec extends Component {
  constructor(props) {
    super(props);
    this.state = {
      speechRec: true,
      recognizing: false
    };
    var SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.onstart = function() {
      recognizing = true;
      document.getElementById("speechRecBtn").value = "Stop";
    };

    this.recognition.onend = function() {
      recognizing = false;
    };

    this.recognition.onerror = function() {
      recognizing = false;
    };
    this.recognition.onresult = function(event) {
      var current = event.resultIndex;
      var transcript = event.results[current][0].transcript;
      // this.props.setQuery(transcript);
      document.getElementById("query").value = transcript;
    };
    this.setQuery = this.setQuery.bind(this);
  }
  setQuery(query) {
    return this.props.setQuery(query);
  }
  render() {
    if (this.state.speechRec) {
      return (
        <Button
          onClick={() => {
            recognizing ? this.recognition.stop() : this.recognition.start();
          }}
          id="speechRecBtn"
          title="Click to speak&#13;Click to stop"
          color="primary"
        >
          <i className="fa fa-microphone" />
        </Button>
      );
    }
  }
}

export default SpeechRec;
