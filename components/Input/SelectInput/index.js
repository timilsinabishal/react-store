import React from 'react';
import PropTypes from 'prop-types';

import { iconNames } from '../../../constants';
import DangerButton from '../../Action/Button/DangerButton';
import Button from '../../Action/Button';
import { FaramInputElement } from '../../General/FaramElements';
import Label from '../Label';
import HintAndError from '../HintAndError';
import {
    calcFloatPositionInMainWindow,
    defaultOffset,
    defaultLimit,
} from '../../../utils/bounds';
import {
    caseInsensitiveSubmatch,
    getRatingForContentInString,
} from '../../../utils/common';

import Options from './Options';
import styles from './styles.scss';

const propTypeKey = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
]);

const propTypes = {
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    error: PropTypes.string,
    hideClearButton: PropTypes.bool,
    hint: PropTypes.string,
    keySelector: PropTypes.func,
    label: PropTypes.string,

    // Note labelSelector must return string
    labelSelector: PropTypes.func,
    onChange: PropTypes.func,

    // optionLabelSelector may return renderable node
    optionLabelSelector: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object),
    optionsClassName: PropTypes.string,
    placeholder: PropTypes.string,
    renderEmpty: PropTypes.func,
    showHintAndError: PropTypes.bool,
    showLabel: PropTypes.bool,
    title: PropTypes.string,
    value: propTypeKey,
};

const defaultProps = {
    autoFocus: undefined,
    className: '',
    disabled: false,
    readOnly: false,
    error: undefined,
    hideClearButton: false,
    hint: undefined,
    keySelector: (d = {}) => d.key,
    label: undefined,
    labelSelector: (d = {}) => d.label,
    onChange: () => {},
    optionLabelSelector: undefined,
    options: [],
    optionsClassName: '',
    placeholder: 'Select an option',
    renderEmpty: undefined,
    showHintAndError: true,
    showLabel: true,
    title: undefined,
    value: undefined,
};

const getInputValue = ({
    value,
    labelSelector,
    keySelector,
    options,
}) => {
    const activeOption = options.find(
        d => keySelector(d) === value,
    );

    if (!activeOption) {
        return '';
    }

    return labelSelector(activeOption);
};

const filterAndSortOptions = ({
    options,
    value = '',
    labelSelector,
}) => {
    const newOptions = options.filter(
        option => caseInsensitiveSubmatch(
            labelSelector(option),
            value,
        ),
    );

    const rate = getRatingForContentInString;
    newOptions.sort((a, b) => (
        rate(value, labelSelector(a)) - rate(value, labelSelector(b))
    ));

    return newOptions;
};

class SelectInput extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            focusedKey: undefined,
            displayOptions: props.options,
            inputInFocus: props.autoFocus,
            inputValue: getInputValue(props),
            showOptions: false,
        };

        this.container = React.createRef();
        this.input = React.createRef();
    }

    componentDidMount() {
        const { current: container } = this.container;
        if (container) {
            this.boundingClientRect = container.getBoundingClientRect();
        }
    }

    componentWillReceiveProps(nextProps) {
        const {
            value: newValue,
            options: newOptions,
        } = nextProps;

        const {
            value: oldValue,
            options: oldOptions,
        } = this.props;

        if (oldValue !== newValue || oldOptions !== newOptions) {
            // NOTE: filter will be cleared
            this.setState({
                inputValue: getInputValue(nextProps),
                displayOptions: newOptions,
            });
        }

        // FIXME: check if value is in options?
    }

    getClassName = () => {
        const {
            error,
            className,
            disabled,
            hideClearButton,
        } = this.props;

        const {
            inputValue,
            showOptions,
            inputInFocus,
        } = this.state;

        const classNames = [
            className,
            'select-input',
            styles.selectInput,
        ];

        if (showOptions) {
            classNames.push(styles.showOptions);
            classNames.push('show-options');
        }

        if (disabled) {
            classNames.push(styles.disabled);
            classNames.push('disabled');
        }

        if (error) {
            classNames.push(styles.error);
            classNames.push('error');
        }

        if (inputInFocus) {
            classNames.push(styles.inputInFocus);
            classNames.push('input-in-focus');
        }

        if (hideClearButton) {
            classNames.push(styles.hideClearButton);
            classNames.push('hide-clear-button');
        }

        if (inputValue && inputValue.length !== 0) {
            classNames.push(styles.filled);
            classNames.push('filled');
        }

        return classNames.join(' ');
    }

    handleOptionsInvalidate = (optionsContainer) => {
        const contentRect = optionsContainer.getBoundingClientRect();
        let parentRect = this.boundingClientRect;
        const { current: container } = this.container;

        if (container) {
            parentRect = container.getBoundingClientRect();
        }

        const { showHintAndError } = this.props;

        const offset = { ...defaultOffset };
        if (showHintAndError) {
            offset.top = 12;
        }

        const optionsContainerPosition = (
            calcFloatPositionInMainWindow({
                parentRect,
                contentRect,
                offset,
                limit: {
                    ...defaultLimit,
                    minW: parentRect.width,
                    maxW: parentRect.width,
                },
            })
        );

        return optionsContainerPosition;
    };

    handleOptionsBlur = () => {
        const { options } = this.props;
        const inputValue = getInputValue(this.props);

        this.setState({
            showOptions: false,
            displayOptions: options,
            inputValue,
        });
    }

    handleClearButtonClick = () => {
        const {
            onChange,
            value,
        } = this.props;

        if (value) {
            onChange(undefined);
        }
    }

    toggleDropdown = () => {
        const { current: container } = this.container;
        const { current: input } = this.input;
        const { options, value } = this.props;
        const { showOptions } = this.state;

        if (showOptions) {
            this.handleOptionsBlur();
        } else {
            if (input) {
                input.select();
            }

            if (container) {
                this.boundingClientRect = container.getBoundingClientRect();
            }
        }

        this.setState({
            displayOptions: options,
            showOptions: !showOptions,
            focusedKey: value,
        });
    }

    handleDropdownButtonClick = () => {
        this.toggleDropdown();
    }

    handleInputChange = (e) => {
        const { value } = e.target;
        const displayOptions = filterAndSortOptions({
            ...this.props,
            value,
        });

        this.setState({
            displayOptions,
            inputValue: value,
            showOptions: true,
            focusedKey: undefined,
        });
    }

    handleInputKeyDown = (e) => {
        const { focusedKey, displayOptions, showOptions } = this.state;
        const { keySelector } = this.props;

        // Keycodes:
        // 9: Tab
        // 27: Escape
        // 13: Enter
        // 32: Space
        // 38: Down
        // 40: Up

        // If tab or escape was pressed and dropdown is being shown,
        // hide the dropdown.
        if ((e.keyCode === 9 || e.keyCode === 27) && showOptions) {
            this.toggleDropdown();
            return;
        }

        // List of special keys, we are going to handle
        const specialKeys = [40, 38, 13, 32];
        if (displayOptions.length === 0 || specialKeys.indexOf(e.keyCode) === -1) {
            return;
        }

        // Handle space and enter keys only if an option is focused
        if ((e.keyCode === 13 || e.keyCode === 32) && !focusedKey) {
            return;
        }

        // First, disable default behaviour for these keys
        e.stopPropagation();
        e.preventDefault();

        // If any of the special keys was pressed but the dropdown is currently hidden,
        // show the dropdown.
        if (!showOptions) {
            this.toggleDropdown();
            return;
        }

        if (e.keyCode === 13 || e.keyCode === 32) {
            this.handleOptionClick(focusedKey);
            return;
        }

        // For up and down key, find which option is currently focused
        const index = displayOptions.findIndex(o => keySelector(o) === focusedKey);

        // And then calculate new option to focus
        let newFocusedKey;
        if (e.keyCode === 40) {
            if (index < displayOptions.length) {
                newFocusedKey = keySelector(displayOptions[index + 1]);
            }
        } else if (e.keyCode === 38) {
            if (index === -1) {
                newFocusedKey = keySelector(displayOptions[displayOptions.length - 1]);
            } else if (index > 0) {
                newFocusedKey = keySelector(displayOptions[index - 1]);
            }
        }

        this.setState({ focusedKey: newFocusedKey });
    }

    handleInputClick = () => {
        this.toggleDropdown();
    }

    handleInputFocus = () => {
        this.setState({ inputInFocus: true });
    }

    handleInputBlur = () => {
        this.setState({ inputInFocus: false });
    }

    handleOptionClick = (optionKey) => {
        const {
            value,
            onChange,
        } = this.props;

        this.setState({
            inputValue: getInputValue(this.props),
            showOptions: false,
        });

        if (optionKey !== value) {
            onChange(optionKey);
        }
    }

    handleOptionFocus = (focusedKey) => {
        this.setState({ focusedKey });
    }

    renderClearButton = () => {
        const {
            disabled,
            readOnly,
            value,
            hideClearButton,
        } = this.props;

        const showClearButton = value && !(hideClearButton || disabled || readOnly);

        if (!showClearButton) {
            return null;
        }

        const className = `
            clear-button
            ${styles.clearButton}
        `;

        return (
            <DangerButton
                tabIndex="-1"
                iconName={iconNames.close}
                className={className}
                onClick={this.handleClearButtonClick}
                transparent
            />
        );
    }

    renderActions = () => {
        const {
            disabled,
            readOnly,
        } = this.props;

        const className = `
            actions
            ${styles.actions}
        `;
        const dropdownButtonClassName = `
            dropdown-button
            ${styles.dropdownButton}
        `;

        const ClearButton = this.renderClearButton;

        return (
            <div className={className}>
                <ClearButton />
                <Button
                    tabIndex="-1"
                    iconName={iconNames.arrowDropdown}
                    className={dropdownButtonClassName}
                    onClick={this.handleDropdownButtonClick}
                    disabled={disabled || readOnly}
                    transparent
                />
            </div>
        );
    }

    renderInputAndActions = () => {
        const className = `
            ${styles.inputAndActions}
            input-and-actions
        `;

        const {
            disabled,
            readOnly,
            placeholder,
            autoFocus,
        } = this.props;

        const { inputValue } = this.state;
        const Actions = this.renderActions;

        const inputClassName = `
            input
            ${styles.input}
        `;

        return (
            <div className={className}>
                <input
                    className={inputClassName}
                    disabled={disabled || readOnly}
                    onBlur={this.handleInputBlur}
                    onChange={this.handleInputChange}
                    onClick={this.handleInputClick}
                    onFocus={this.handleInputFocus}
                    onKeyDown={this.handleInputKeyDown}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    ref={this.input}
                    type="text"
                    value={inputValue}
                />
                <Actions />
            </div>
        );
    }

    render() {
        const {
            error,
            hint,
            keySelector,
            label,
            labelSelector,
            optionLabelSelector,
            optionsClassName,
            renderEmpty,
            showHintAndError,
            showLabel,
            title,
            value,
        } = this.props;

        const {
            displayOptions,
            showOptions,
            focusedKey,
        } = this.state;

        const InputAndActions = this.renderInputAndActions;
        const className = this.getClassName();
        const { current: container } = this.container;

        return (
            <div
                className={className}
                ref={this.container}
                title={title}
            >
                <Label
                    className={styles.label}
                    show={showLabel}
                    text={label}
                />
                <InputAndActions />
                <HintAndError
                    show={showHintAndError}
                    error={error}
                    hint={hint}
                />
                <Options
                    className={optionsClassName}
                    data={displayOptions}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onBlur={this.handleOptionsBlur}
                    onInvalidate={this.handleOptionsInvalidate}
                    onOptionClick={this.handleOptionClick}
                    onOptionFocus={this.handleOptionFocus}
                    optionLabelSelector={optionLabelSelector}
                    parentContainer={container}
                    renderEmpty={renderEmpty}
                    show={showOptions}
                    value={value}
                    focusedKey={focusedKey}
                />
            </div>
        );
    }
}

export default FaramInputElement(SelectInput);
