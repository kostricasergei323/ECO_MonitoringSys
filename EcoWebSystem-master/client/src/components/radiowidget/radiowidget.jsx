import React, { useRef, useEffect, useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';

import './radiowidget.css';

const Widget = ({}) => {
  const refer = useRef(null);

  useEffect(() => {
    const connectionScript = document.createElement('script');
    const initialComponentScript = document.createElement('script');
    connectionScript.src =
      'https://rewidget.jrc.ec.europa.eu/v3/loader.ashx?theme=eu-2015&lang=en';
    initialComponentScript.innerHTML =
      "__eurdep_maps('widget', {center: [49.664447, 31.034037], zoom: 6});";
    refer.current.append(connectionScript);
    connectionScript.onload = () => {
      refer.current.append(initialComponentScript);
    };
  }, []);

  return (
    <div ref={refer}>
      <div id='widget' style={{ height: '500px' }}>
        <Spinner
          className='loading-spiner'
          animation='border'
          variant='primary'
        />
      </div>
    </div>
  );
};

export const RadioWidget = ({ hideRadio, showRadioModal, size }) => {
  return (
    <Modal
      show={showRadioModal}
      onHide={hideRadio}
      size={size || 'lg'}
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>
          Радіаційний моніторинг
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Widget />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hideRadio}>Закрити</Button>
      </Modal.Footer>
    </Modal>
  );
};
