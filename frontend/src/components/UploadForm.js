import React, { useState } from 'react';
import { getPublicFiles, getPrivateFiles } from '../services/api';

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCheckboxChange = (e) => {
    setIsPrivate(e.target.checked);
  };
  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    const socket = new WebSocket('ws://localhost:3222');
    let totalBytesSent = 0;

    socket.onopen = () => {
      const metadata = {
        filename: file.name,
        size: file.size,
        isPrivate: isPrivate
      };
      socket.send(JSON.stringify({ type: 'file_upload_metadata', payload: metadata }));

      const reader = new FileReader();
      const chunkSize = 10 * 1024 * 1024;
      let offset = 0;

      reader.onload = () => {
        const chunk = reader.result;
        socket.send(chunk);
        totalBytesSent += chunk.byteLength;

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
        if (data.type === 'file_resume') {
          const resumeOffset = parseInt(data.payload);
          console.log('Resuming upload from byte:', resumeOffset);
          totalBytesSent = resumeOffset;
          readChunk(resumeOffset);
        } else if (data.success) {
          onUploadSuccess();
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

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  return (
    <div>
      <h2>Upload File via Socket</h2>
      <input type="file" onChange={handleFileChange} />
      <label>
        Is Private:
        <input type="checkbox" checked={isPrivate} onChange={handleCheckboxChange} />
      </label>
      <button onClick={handleUpload}>Upload</button>
      {progress > 0 && <div>Progress: {progress}%</div>}
    </div>
  );
};

export default UploadForm;
