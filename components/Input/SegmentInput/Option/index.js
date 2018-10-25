import React from 'react';
import PropTypes from 'prop-types';

import { randomString } from '../../../../utils/common';
import styles from './styles.scss';

const propTypes = {
    id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]).isRequired,
    onChange: PropTypes.func.isRequired,
    checked: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
};

const defaultProps = {
    error: '',
    disabled: false,
    readOnly: false,
};

export default class SegmentOption extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.inputId = randomString().toLowerCase();
    }

    getClassName = () => {
        const {
            disabled,
            error,
            readOnly,
            checked,
        } = this.props;

        const classNames = [
            'segment-option',
            styles.segmentOption,
        ];

        if (checked) {
            classNames.push('checked');
            classNames.push(styles.checked);
        }
        if (readOnly) {
            classNames.push('read-only');
            classNames.push(styles.readOnly);
        }
        if (disabled) {
            classNames.push('disabled');
            classNames.push(styles.disabled);
        }
        if (error) {
            classNames.push('error');
            classNames.push(styles.error);
        }
        return classNames.join(' ');
    }

    render() {
        const {
            id,
            onChange,
            checked,
            label,
        } = this.props;

        const classNames = this.getClassName();

        return (
            <label
                htmlFor={this.inputId}
                className={classNames}
            >
                <input
                    className={`${styles.segmentButtonInput} segment-option-input`}
                    type="radio"
                    onChange={onChange}
                    checked={checked}
                    id={this.inputId}
                    value={id}
                />
                {label}
            </label>
        );
    }
}

