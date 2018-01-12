import React from 'react';

import { iconNames } from '../../../constants';

import styles from './styles.scss';
import {
    singleSelectInputPropTypes,
    singleSelectInputDefaultProps,
} from './propTypes';
import {
    getClassName,
    getOptionClassName,
    renderLabel,
    renderHintAndError,
    renderOptions,
    isOptionActive,
    handleInputValueChange,
    handleInputClick,
    getOptionsContainerPosition,
    renderClearButton,
} from './utils';

export default class SelectInput extends React.PureComponent {
    static propTypes = singleSelectInputPropTypes;
    static defaultProps = singleSelectInputDefaultProps;

    constructor(props) {
        super(props);

        this.state = {
            isFocused: false,
            inputValue: this.getActiveOptionLabel(props),
            displayOptions: props.options,
        };
    }

    componentWillReceiveProps(nextProps) {
        const {
            value: oldValue,
            options: oldOptions,
        } = this.props;

        if (nextProps.value !== oldValue || nextProps.options !== oldOptions) {
            this.setState({
                inputValue: this.getActiveOptionLabel(nextProps),
            });
        }
    }

    getValue = () => this.props.value

    getActiveOptionLabel = (props) => {
        const {
            value,
            labelSelector,
            keySelector,
            options,
        } = props;

        const activeOption = options.find(d => keySelector(d) === value);
        return (activeOption && labelSelector(activeOption)) || '';
    }

    handleInputChange = (e) => { handleInputValueChange(this, e.target.value); }

    handleOptionContainerInvalidate = optionsContainer => (
        getOptionsContainerPosition(this, optionsContainer)
    )

    handleOptionContainerBlur = () => {
        const {
            keySelector,
            labelSelector,
            options,
            value,
        } = this.props;

        let inputValue;
        if (value) {
            inputValue = labelSelector(options.find(d => keySelector(d) === value));
        } else {
            inputValue = '';
        }

        this.setState({
            showOptions: false,
            displayOptions: options,
            inputValue,
        });
    }

    handleOptionClick = (key) => {
        const {
            value,
            onChange,
        } = this.props;

        this.setState({
            showOptions: false,
        });

        if (key !== value) {
            onChange(key);
        }
    }

    handleClearButtonClick = () => {
        const {
            onChange,
            value,
        } = this.props;

        if (value) {
            onChange();
        }
    }

    renderInput = () => {
        const {
            disabled,
            placeholder,
        } = this.props;
        const { inputValue } = this.state;

        return (
            <input
                className={`input ${styles.input}`}
                disabled={disabled}
                onChange={this.handleInputChange}
                onClick={() => { handleInputClick(this); }}
                placeholder={placeholder}
                ref={(el) => { this.input = el; }}
                type="text"
                value={inputValue}
            />
        );
    }

    renderActions = () => {
        const {
            disabled,
            value,
            hideClearButton,
        } = this.props;
        const showClearButton = value && !(hideClearButton || disabled);
        const ClearButton = renderClearButton;

        return (
            <div className={`actions ${styles.actions}`}>
                <ClearButton
                    show={showClearButton}
                    styles={styles}
                    parent={this}
                />
                <span className={`dropdown-icon ${styles['dropdown-icon']} ${iconNames.arrowDropdown}`} />
            </div>
        );
    }

    renderOption = (p) => {
        const {
            labelSelector,
            keySelector,
            value,
        } = this.props;
        const { option } = p;
        const key = keySelector(option);

        return (
            <button
                className={getOptionClassName(styles, isOptionActive(key, [value]))}
                onClick={() => { this.handleOptionClick(key); }}
            >
                { labelSelector(option) }
            </button>
        );
    }

    render() {
        const className = getClassName(styles, 'single-select-input', this.state, this.props);
        const Label = renderLabel;
        const Input = this.renderInput;
        const Actions = this.renderActions;
        const Options = renderOptions;
        const HintAndError = renderHintAndError;

        return (
            <div
                ref={(el) => { this.container = el; }}
                className={className}
            >
                <Label
                    styles={styles}
                    {...this.props}
                />
                <div className={`input-wrapper ${styles['input-wrapper']}`}>
                    <Input />
                    <Actions />
                </div>
                <HintAndError
                    styles={styles}
                    {...this.props}
                />
                <Options
                    parent={this}
                    styles={styles}
                />
            </div>
        );
    }
}

export { default as MultiSelectInput } from './MultiSelectInput';
