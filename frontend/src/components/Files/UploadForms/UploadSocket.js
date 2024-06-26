import React, { useState, useEffect } from 'react';

const UploadSocket = ({ onUploadSuccess }) => {
  const [sessionId, setSessionId] = useState(null);
  const [file, setFile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sessionId && file) {
      handleUpload();
    }
  }, [sessionId, file]);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCheckboxChange = (e) => {
    setIsPrivate(e.target.checked);
  };

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
  };

  const handleWebSocketClose = async () => {
    console.log('WebSocket connection closed');
    await onUploadSuccess();
  };

  const handleWebSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received message:', data);

    if (data.type === 'session_id') {
      setSessionId(data.payload);
    }
  
  };

  const handleWebSocketOpen = (socket) => {
    socket.onmessage = handleWebSocketMessage;
    socket.onerror = handleWebSocketError;
    socket.onclose = handleWebSocketClose;
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }
  
    const socket = new WebSocket('wss://molex.cloud/wss/');
    
    let totalBytesSent = 0;
    
    const token = localStorage.getItem('token');
    let userId = null;
    let username = null;
    if(token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
      username = payload.username;
      console.log('User ID:', userId);
      console.log('Username:', username);
    }
  
    socket.onopen = () => {
      handleWebSocketOpen(socket);
      const metadata = {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        isPrivate: isPrivate,
        author: username,
        userId: userId,
        sessionId: sessionId
      };
      console.log('Sending metadata:', metadata);
      socket.send(JSON.stringify({ type: 'file_upload_metadata', sessionId, payload: metadata }));
  
      const reader = new FileReader();
      const chunkSize = 1024 * 1024;
      let offset = 0;
  
      reader.onload = () => {
        const chunk = reader.result;
  
        totalBytesSent += chunk.byteLength;
        socket.send(chunk);
  
        offset += chunkSize;
        if (offset < file.size) {
          let progress = Math.round((totalBytesSent / file.size) * 100);
          setProgress(progress);
          console.log('Progress:', progress + '%');
          readChunk();
        } else {
          console.log('Total bytes sent:', totalBytesSent);
          console.log('File size:', file.size);
          if (totalBytesSent === file.size) {
            socket.send(JSON.stringify({ type: 'file_upload_end' }));
          }
        }
      };
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
  
        if (data.type === 'file_upload_session_id') {
          setSessionId(data.payload);
        }
  
        if (data.type === 'file_resume') {
          const resumeOffset = parseInt(data.payload);
          console.log('Resuming upload from byte:', resumeOffset);
          totalBytesSent = resumeOffset;
          readChunk(resumeOffset);
        } else if (data.success) {
          socket.close();
        } else if (data.error) {
          console.error('Error:', data.error);
          socket.close();
        }
      };
  
      const readChunk = () => {
        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(chunk);
      };
  
      readChunk();
    };
  
    socket.onclose = async () => {
      console.log('WebSocket connection closed');
      await onUploadSuccess();
    };
  };
  

  const selectFile = () => {
    document.querySelector('.fileInput').click();
  }

  return (
    <div>
      <div className='modalTitle'>{sessionId}</div>
      <div className='uploadFormFields'>
        <input type="file" className='fileInput' onChange={handleFileChange} />
        <button className='button' onClick={selectFile}>
          { file ? file.name : 'Select File' }
        </button>
        {progress > 0 && <div>Progress: {progress}%</div>}
      </div>
      <div className='uploadControlsDiv'>
        <label>
          Is Private:
          <input type="checkbox" checked={isPrivate} onChange={handleCheckboxChange} />
        </label>
        <button className='button' style={{ width: '100%' }} onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
};

export default UploadSocket;
