import PropTypes from 'prop-types';
import React from 'react';

import FormattedDate from './FormattedDate';

// NOTE: capturing 'date', as it is deprecated in FormattedDate
// eslint-disable-next-line no-unused-vars
const FormattedTime = ({ value, date, ...otherProps }) => {
    const newValue = value ? `1994-12-25 ${value}` : value;
    return (
        <FormattedDate
            {...otherProps}
            value={newValue}
            mode="hh:mm"
        />
    );
};

FormattedTime.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),
    date: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),
};
FormattedTime.defaultProps = {
    value: undefined,
    date: undefined,
};

export default FormattedTime;
