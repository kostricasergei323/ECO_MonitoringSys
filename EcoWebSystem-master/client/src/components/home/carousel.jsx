import React from 'react';
import { Carousel } from 'react-bootstrap';

import img1 from '../../images/1.jpg';
import img2 from '../../images/2.jpg';
import img3 from '../../images/3.jpg';
import img4 from '../../images/4.jpg';
import img5 from '../../images/5.jpg';
import img6 from '../../images/6.jpeg';

export const CarouselView = () => {
  return (
    <Carousel interval={50000} className='carousel'>
      <Carousel.Item>
        <img className='w-100' src={img1} alt='First slide' />
        <Carousel.Caption>
          <h3>Управління водними ресурсами</h3>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img className='w-100' src={img2} alt='Second slide' />
        <Carousel.Caption>
          <h3>Комплексний еколого-економічний моніторинг</h3>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img className='w-100' src={img3} alt='Third slide' />
        <Carousel.Caption>
          <h3>Управління відходами</h3>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img className='w-100' src={img4} alt='Fourth slide' />
        <Carousel.Caption>
          <h3>Охорона земель</h3>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img className='w-100' src={img5} alt='Fifth slide' />
        <Carousel.Caption>
          <h3>Атмосферне повітря</h3>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img className='w-100' src={img6} alt='Sixth slide' />
        <Carousel.Caption>
          <h3>Здоров'я населення</h3>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
};
