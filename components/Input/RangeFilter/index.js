import PropTypes from 'prop-types';
import React from 'react';

import { FaramInputElement } from '../../General/FaramElements';
import SelectInput from '../SelectInput';

const propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.arrayOf(PropTypes.string),
    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
    })),
};

const defaultProps = {
    className: '',
    label: '',
    value: undefined,
    options: [],
};


class RangeFilter extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        this.updateFromProps(props);
    }

    componentWillReceiveProps(nextProps) {
        // Checking this.value instead of this.props.value is intentional
        if (
            this.value !== nextProps.value ||
            this.props.options !== nextProps.options
        ) {
            this.updateFromProps(nextProps);
        }
    }

    updateFromProps({ value }) {
        this.value = value;
        this.startValue = value && value[0];
        this.endValue = value && value[value.length - 1];
    }

    handleStartValueChange = (startValue) => {
        this.startValue = startValue;
        this.handleUpdate();
    }

    handleEndValueChange = (endValue) => {
        this.endValue = endValue;
        this.handleUpdate();
    }

    handleUpdate() {
        const { options, onChange } = this.props;
        const startIndex = this.startValue ?
            options.findIndex(o => o.key === this.startValue) : 0;
        const endIndex = this.endValue ?
            options.findIndex(o => o.key === this.endValue) : options.length - 1;

        this.value = options.slice(startIndex, endIndex + 1).map(o => o.key);
        onChange(this.value);
    }

    render() {
        const {
            className,
            label,
            value, // eslint-disable-line no-unused-vars
            onChange, // eslint-disable-line no-unused-vars
            ...otherProps
        } = this.props;

        return (
            <div className={className}>
                <SelectInput
                    onChange={this.handleStartValueChange}
                    value={this.startValue}
                    label={`${label} from`}
                    {...otherProps}
                />
                <SelectInput
                    onChange={this.handleEndValueChange}
                    value={this.endValue}
                    label={`${label} to`}
                    {...otherProps}
                />
            </div>

        );
    }
}

export default FaramInputElement(RangeFilter);
