import { useState, useEffect } from 'react';

export const useWebSocket = () => {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {}, []);

  return { messages, sendMessage };
  };
};