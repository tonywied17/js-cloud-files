import React, { useState } from 'react';
import { downloadFile } from '../services/api';

const PublicFiles = ({ files }) => {
  const [searchText, setSearchText] = useState('');
  const [expandedYears, setExpandedYears] = useState({});

  if (!files) {
    return <p>Loading...</p>;
  }

  const fileList = files.files || [];
  const filteredFiles = fileList.filter((file) =>
    file.filename.toLowerCase().includes(searchText.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const toggleYear = (year) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: !prevExpandedYears[year],
    }));
  };

  const toggleMonth = (year, month) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: {
        ...prevExpandedYears[year],
        [month]: !prevExpandedYears[year]?.[month],
      },
    }));
  };

  const toggleDay = (year, month, day) => {
    setExpandedYears((prevExpandedYears) => ({
      ...prevExpandedYears,
      [year]: {
        ...prevExpandedYears[year],
        [month]: {
          ...prevExpandedYears[year]?.[month],
          [day]: !prevExpandedYears[year]?.[month]?.[day],
        },
      },
    }));
  };

  return (
    <div className='filesContainer'>
      <div className='filesHeader'>
        <input
          type='text'
          value={searchText}
          placeholder='Search...'
          onChange={handleSearchChange}
        />
      </div>
      {!searchText && (
        <div className='fileTree'>
          {Object.entries(groupFilesByDate(fileList)).map(([year, months]) => (
            <div key={year} className='yearNode'>

              {/* ? Toggle Year Tree */}
              <h3 onClick={() => toggleYear(year)}>
                {year} {expandedYears[year] ? '▲' : '▼'}
              </h3>
              {expandedYears[year] && (
                <div className='monthNodes'>
                  {Object.entries(months).map(([month, days]) => (
                    <div key={month} className='monthNode'>

                      {/* ? Toggle Month Tree */}
                      <h4 onClick={() => toggleMonth(year, month)}>
                        {month} {expandedYears[year]?.[month] ? '▲' : '▼'}
                      </h4>
                      {expandedYears[year]?.[month] && (
                        <div className='dayNodes'>
                          {Object.entries(days).map(([day, dayFiles]) => (
                            <div key={day} className='dayNode'>

                              {/* ? Toggle Day Files */}
                              <h5 onClick={() => toggleDay(year, month, day)}>
                                {day} {expandedYears[year]?.[month]?.[day] ? '▲' : '▼'}
                              </h5>
                              {expandedYears[year]?.[month]?.[day] && (
                                <div className='fileGrids'>
                                  {dayFiles.map((file, index) => (
                                    <div className='fileDetailsBox' key={index}>
                                      <div className='fileDetailsContainer'>
                                        <div>{file.filename}</div>
                                        <div>{file.fileType}</div>
                                      </div>
                                      <div className='fileButtonsContainer'>
                                        <button
                                          className='button'
                                          onClick={() =>
                                            copyToClipboard(
                                              'https://molex.cloud/api/files/download/' + file.id
                                            )
                                          }
                                        >
                                          Copy Share Link
                                        </button>
                                        <button
                                          className='button'
                                          onClick={() => downloadFile(file.id, file.filename)}
                                        >
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {searchText && (
        <div className='fileGrids'>
          {filteredFiles.map((file, index) => (
            <div className='fileDetailsBox' key={index}>
              <div className='fileDetailsContainer'>
                <div>{file.filename}</div>
                <div>{file.fileType}</div>
              </div>
              <div className='fileButtonsContainer'>
                <button
                  className='button'
                  onClick={() =>
                    copyToClipboard(
                      'https://molex.cloud/api/files/download/' + file.id
                    )
                  }
                >
                  Copy Share Link
                </button>
                <button
                  className='button'
                  onClick={() => downloadFile(file.id, file.filename)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicFiles;

//! Group files by date 
const groupFilesByDate = (files) => {
  return files.reduce((acc, file) => {
    const date = new Date(file.createdAt);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = {};
    }
    if (!acc[year][month][day]) {
      acc[year][month][day] = [];
    }
    acc[year][month][day].push(file);

    return acc;
  }, {});
};
