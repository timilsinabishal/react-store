import PropTypes from 'prop-types';
import React from 'react';

import {
    isTruthy,
    isFalsy,
    addSeparator,
} from '../../../utils/common';
import { FaramInputElement } from '../../General/FaramElements';
import Delay from '../../General/Delay';

import HintAndError from '../HintAndError';
import Label from '../Label';
import styles from './styles.scss';

const propTypes = {
    /**
     * required for style override
     */
    className: PropTypes.string,

    /**
     * Is input disabled?
     */
    disabled: PropTypes.bool,

    /**
     * String to show in case of error
     */
    error: PropTypes.string,

    /**
     * Hint text
     */
    hint: PropTypes.string,

    /**
     * Input label
     */
    label: PropTypes.string,

    /**
     * A callback for when the input loses focus
     */
    onBlur: PropTypes.func,

    /**
     * A callback for when the input changes its content
     */
    onChange: PropTypes.func,

    /**
     * A callback for when the input gets focus
     */
    onFocus: PropTypes.func,

    /**
     * Is a required element for form
     */
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    showHintAndError: PropTypes.bool,
    value: PropTypes.number,
    separator: PropTypes.string,
    selectOnFocus: PropTypes.bool,
    title: PropTypes.string,
};

const defaultProps = {
    className: '',
    disabled: false,
    error: '',
    hint: '',
    label: '',
    onBlur: undefined,
    onChange: undefined,
    onFocus: undefined,
    required: false,
    showLabel: true,
    showHintAndError: true,
    value: undefined,
    separator: ',',
    selectOnFocus: false,
    title: undefined,
};

const INT_LIMIT = 9007199254740992;

class NumberInput extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    // NOTE: no sign part here
    static changeToNumber = (val = '') => {
        const newVal = val.replace(/[^0-9]/g, '');
        // Limit integer value to MAX_LIMIT
        if (newVal !== '') {
            const realValue = +newVal;
            if (isTruthy(realValue)) {
                return String(Math.min(INT_LIMIT, realValue));
            }
        }
        return newVal;
    };

    static concatNumber = (sign, value) => {
        let op = '';
        if (isTruthy(sign)) {
            op += sign;
        }
        if (isTruthy(value)) {
            op += value;
        }
        return op;
    }

    static calculateNewValues = (v, separator) => {
        if (isFalsy(v)) {
            return {};
        }
        // NOTE: Value provided is most likely to be number
        // when it is provided from props, change it to string first
        const stringifiedV = String(v);

        let signPart;
        let numberPart = stringifiedV;
        // extract sign if there is a sign
        if (stringifiedV[0] === '-' || stringifiedV[0] === '+') {
            // eslint-disable-next-line prefer-destructuring
            signPart = stringifiedV[0];
            numberPart = stringifiedV.substr(1);
        }

        // get string with only number
        const numberSanitizedPart = NumberInput.changeToNumber(numberPart);
        const numberWithCommaPart = addSeparator(numberSanitizedPart, separator);

        // get value to display
        const displayValue = NumberInput.concatNumber(signPart, numberWithCommaPart);

        // get value to return outside
        let value = NumberInput.concatNumber(signPart, numberSanitizedPart);
        if (value === '+' || value === '-' || value === '') {
            value = undefined;
        } else {
            value = +value;
        }

        return { value, displayValue };
    }

    constructor(props) {
        super(props);

        const { displayValue } = NumberInput.calculateNewValues(
            props.value,
            props.separator,
        );

        this.state = {
            isFocused: false,
            value: displayValue,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            const { displayValue } = NumberInput.calculateNewValues(
                nextProps.value,
                nextProps.separator,
            );
            this.setState({ value: displayValue });
        }
    }

    getClassName() {
        const {
            disabled,
            error,
            required,
            className,
        } = this.props;

        const {
            isFocused,
        } = this.state;

        const classNames = [
            className,
            'number-input',
            styles.numberInput,
        ];

        if (disabled) {
            classNames.push(styles.disabled);
            classNames.push('disabled');
        }

        if (isFocused) {
            classNames.push(styles.focused);
            classNames.push('focused');
        }

        if (error) {
            classNames.push(styles.error);
            classNames.push('error');
        }

        if (required) {
            classNames.push(styles.required);
            classNames.push('required');
        }

        return classNames.join(' ');
    }

    handleChange = (event) => {
        const { separator } = this.props;
        const { value: val } = event.target;

        const { value } = NumberInput.calculateNewValues(
            val,
            separator,
        );

        /*
        // NOTE: this may not be required
        this.setState({ value: displayValue });
        */

        const { onChange } = this.props;
        if (onChange) {
            onChange(value);
        }
    }

    handleFocus = () => {
        const { selectOnFocus, onFocus } = this.props;
        if (selectOnFocus) {
            // eslint-disable-next-line no-restricted-globals
            event.target.select();
        }

        this.setState({ isFocused: true });
        if (onFocus) {
            onFocus();
        }
    }

    handleBlur = () => {
        const { onBlur } = this.props;
        this.setState({ isFocused: false });
        if (onBlur) {
            onBlur();
        }
    }

    render() {
        const {
            // skip prop injection
            value: propValue, // eslint-disable-line no-unused-vars
            onBlur, // eslint-disable-line no-unused-vars
            onChange, // eslint-disable-line no-unused-vars
            onFocus, // eslint-disable-line no-unused-vars
            selectOnFocus, // eslint-disable-line no-unused-vars
            className: propClassName, // eslint-disable-line no-unused-vars

            error,
            hint,
            label,
            showLabel,
            showHintAndError,
            title,
            ...otherProps
        } = this.props;

        const { value = '' } = this.state;

        const className = this.getClassName();

        return (
            <div
                className={className}
                title={title}
            >
                <Label
                    className={styles.label}
                    show={showLabel}
                    text={label}
                />
                <input
                    className={`${styles.input} input`}
                    onBlur={this.handleBlur}
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                    value={value}
                    {...otherProps}
                />
                <HintAndError
                    show={showHintAndError}
                    hint={hint}
                    error={error}
                />
            </div>
        );
    }
}

export default FaramInputElement(Delay(NumberInput));
