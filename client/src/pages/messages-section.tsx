import React, { useState } from 'react';

export default function MessagesSection() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    setMessages([...messages, input]);
    setInput('');
  };

  return (
    <div className="p-4">
      <div className="h-64 overflow-auto border p-2 mb-2">
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      <input
        className="border p-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="ml-2 p-2 bg-blue-500 text-white" onClick={sendMessage}>
        Send
      </button>
        </div>
  );
}
