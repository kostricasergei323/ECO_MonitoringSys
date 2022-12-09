import React from 'react';

import './pseudo.css';

export const Pseudo = ({ setOpened }) => {
  return (
    <div
      onClick={() => {
        setOpened((prev) => !prev);
      }}
      className='pseudo'
    />
  );
};
