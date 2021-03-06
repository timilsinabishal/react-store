import PropTypes from 'prop-types';
import React from 'react';

import { iconNames } from '../../../constants';
import { randomString } from '../../../utils/common';
import { FaramInputElement } from '../../General/FaramElements';

import styles from './styles.scss';

const propTypes = {
    /**
     * for styling by className
     */
    className: PropTypes.string,

    /**
     * Is input disabled?
     */
    disabled: PropTypes.bool,

    value: PropTypes.bool,

    /**
     * A callback for when the input changes its content
     */
    onChange: PropTypes.func.isRequired,

    /**
     * label for the checkbox
     */
    label: PropTypes.node.isRequired,

    readOnly: PropTypes.bool,

    // FIXME
    changeDelay: PropTypes.number,
};

const defaultProps = {
    className: '',
    disabled: false,
    readOnly: false,
    value: false,
    changeDelay: undefined,
};

class Checkbox extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.inputId = randomString();
    }

    handleInputChange = (e) => {
        const value = e.target.checked;
        this.props.onChange(value);
    }

    render() {
        const {
            label,
            className,
            value,
            disabled,
            readOnly,
            onChange, // eslint-disable-line no-unused-vars
            changeDelay, // eslint-disable-line no-unused-vars
            ...otherProps
        } = this.props;

        const classNames = [
            styles.checkbox,
            value ? styles.checked : '',
            className,
        ];

        if (disabled) {
            classNames.push('disabled');
            classNames.push(styles.disabled);
        }

        if (readOnly) {
            classNames.push('read-only');
            classNames.push(styles.readOnly);
        }

        const spanClassNames = [
            styles.checkmark,
            'checkmark',
            value ? iconNames.checkbox : iconNames.checkboxOutlineBlank,
        ];
        const inputClassNames = [
            'input',
            styles.input,
        ];
        const labelClassNames = [
            'label',
            styles.label,
        ];

        return (
            <label
                htmlFor={this.inputId}
                className={classNames.join(' ')}
            >
                <span className={spanClassNames.join(' ')} />
                <input
                    onChange={this.handleInputChange}
                    className={inputClassNames.join(' ')}
                    type="checkbox"
                    checked={value}
                    id={this.inputId}
                    disabled={disabled || readOnly}
                    {...otherProps}
                />
                <span className={labelClassNames.join(' ')}>
                    { label }
                </span>
            </label>
        );
    }
}

export default FaramInputElement(Checkbox);
