import React from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';

import { post } from '../../utils/httpService';
import { LOGIN_URL } from '../../utils/constants';

export const Auth = (props) => {
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');

  const loginUser = () => {
    post(LOGIN_URL, {
      login: login,
      password: password,
    }).then(({ data: user }) => {
      if (user) {
        props.onHide();
        props.setUser(user);
        sessionStorage.setItem('user', JSON.stringify(user));
      } else {
        alert('Невірний логін / пароль');
      }
    });
  };

  return (
    <Container>
      <Row className='justify-content-center'>
        <Col xs={6}>
          <Form>
            <Form.Group controlId='formUsername' className='pb-2'>
              <Form.Label>Логін:</Form.Label>
              <Form.Control
                type='input'
                placeholder='Введіть логін'
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId='formBasicPassword'>
              <Form.Label>Пароль:</Form.Label>
              <Form.Control
                type='password'
                placeholder='Введіть пароль'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant='primary' className='mt-2' onClick={loginUser}>
              Увійти
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};
