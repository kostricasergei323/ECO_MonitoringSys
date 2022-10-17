import React from 'react';
import { Button } from 'react-bootstrap';

import { Auth } from './auth';
import { VerticallyCenteredModal } from '../modals/modal';

export const Login = ({ setUser }) => {
  const [modalShow, setModalShow] = React.useState(false);

  return (
    <React.Fragment>
      <Button variant='primary' onClick={() => setModalShow(true)}>
        Вхід
      </Button>
      <VerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        header='Вхід до персонального кабінету'
      >
        <Auth onHide={() => setModalShow(false)} setUser={setUser} />
      </VerticallyCenteredModal>
    </React.Fragment>
  );
};
