import { ListGroup } from 'react-bootstrap';
import React from 'react';

export const KEEMPrinciples = () => {
  return (
    <ListGroup className='text-center'>
      <h4>
        Комплексний еко-енерго-економічний моніторинг (КЕЕЕМ) базується на таких
        основних принципах:
      </h4>
      <ListGroup.Item>
        Збір різнорідної екологічної інформації з різних точок регіону
      </ListGroup.Item>
      <ListGroup.Item>
        Оброблення великих масивів даних різними експертами
      </ListGroup.Item>
      <ListGroup.Item>
        Одночасна робота різних експертів з екологічною інформацією та
        інформацією від інших експертів
      </ListGroup.Item>
      <ListGroup.Item>
        Відображення екологічної інформації на карті місцевості для наочності
      </ListGroup.Item>
      <ListGroup.Item>
        Дослідження екологічної інформації за допомогою різних видів
        математичного аналізу
      </ListGroup.Item>
      <ListGroup.Item>
        Оцінка ситуації у визначеному регіоні з точки зору закону та визначення
        законності набору заходів по покращенню екологічного стану регіону або
        ліквідації наслідків надзвичайних ситуацій
      </ListGroup.Item>
    </ListGroup>
  );
};
