import React from "react";
import ChatForm from "./components/ChatForm";
import "./App.css";

const App = () => (
  <div className="app-container">
    <h1>📚 Smart Assistant</h1>
    <p className="subtitle">Ask questions using PDF, a website, or chat with AI.</p>
    <ChatForm />
  </div>
);

export default App;
