import React, { useEffect, useState } from 'react';
import {
  Dropdown,
  Form,
  Button,
  Accordion,
  Card,
  FormControl,
} from 'react-bootstrap';

const dropdownStyles = {
  color: 'white',
  backgroundColor: '#28a745',
  borderColor: '#28a745',
  padding: '.25rem .5rem',
  fontSize: '.875rem',
  lineHeight: '1.5',
  borderRadius: '.2rem',
};

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=''
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{
      color: 'white',
    }}
  >
    {children}
    &#x25bc;
  </a>
));

const CustomMenu = React.forwardRef(
  (
    {
      shouldResetLookup,
      setShouldResetLookup,
      children,
      style,
      className,
      'aria-labelledby': labeledBy,
    },
    ref
  ) => {
    const [value, setValue] = useState('');

    useEffect(() => {
      if (shouldResetLookup) {
        setValue('');
        setShouldResetLookup(false);
      }
    }, [shouldResetLookup]);

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          style={{
            width: '90%',
            margin: '5px auto',
          }}
          placeholder='Пошук...'
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className='list-unstyled'>
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().startsWith(value)
          )}
        </ul>
      </div>
    );
  }
);

export const Lookup = ({ data, onClick, selected }) => {
  const [shouldResetLookup, setShouldResetLookup] = useState(false);

  return (
    <Dropdown style={dropdownStyles}>
      <Dropdown.Toggle as={CustomToggle} id='dropdown-custom-components'>
        {selected.displayName}
      </Dropdown.Toggle>
      <Dropdown.Menu
        as={CustomMenu}
        shouldResetLookup={shouldResetLookup}
        setShouldResetLookup={setShouldResetLookup}
      >
        {data.length &&
          data.map((item) => (
            <Dropdown.Item
              eventKey={item.code}
              onClick={() => {
                setShouldResetLookup(true);
                onClick(item);
              }}
            >
              {item.displayName}
            </Dropdown.Item>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
