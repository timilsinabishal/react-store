import React from 'react';
import PropTypes from 'prop-types';
import FloatingContainer from '../../../View/FloatingContainer';
import List from '../../../View/List';

import Option from '../Option';
import {
    listToMap,
    isArrayEqual,
} from '../../../../utils/common';

import styles from './styles.scss';

const propTypes = {
    activeKeys: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    className: PropTypes.string,
    data: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    keySelector: PropTypes.func.isRequired,
    labelSelector: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onInvalidate: PropTypes.func.isRequired,
    onOptionClick: PropTypes.func.isRequired,
    onOptionFocus: PropTypes.func.isRequired,
    parentContainer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    renderEmpty: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    focusedKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const defaultProps = {
    className: '',
    parentContainer: undefined,
    focusedKey: undefined,
};

export default class Options extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        this.generateActiveMap(props);
    }

    componentWillReceiveProps(nextProps) {
        const { activeKeys: oldActiveKeys } = this.props;
        const { activeKeys: newActiveKeys } = nextProps;

        if (!isArrayEqual(oldActiveKeys, newActiveKeys)) {
            this.generateActiveMap(nextProps);
        }
    }

    getClassName = () => {
        const { className } = this.props;

        const classNames = [
            className,
            styles.options,
        ];

        return classNames.join(' ');
    }

    generateActiveMap = (props) => {
        const { activeKeys } = props;

        this.activeKeysMap = listToMap(
            activeKeys,
            optionKey => optionKey,
            () => true,
        );
    }

    renderOption = (k, data) => {
        const {
            keySelector,
            labelSelector,
            onOptionClick,
            onOptionFocus,
            focusedKey,
        } = this.props;

        const key = keySelector(data);
        const label = labelSelector(data);
        const isActive = !!this.activeKeysMap[key];
        const isFocused = key === focusedKey;

        return (
            <Option
                key={key}
                optionKey={key}
                optionLabel={label}
                onClick={onOptionClick}
                onFocus={onOptionFocus}
                active={isActive}
                focused={isFocused}
            />
        );
    }

    renderEmpty = () => {
        const {
            renderEmpty: EmptyComponent,
            data,
        } = this.props;

        if (data.length > 0) {
            return null;
        }

        const className = `empty ${styles.empty}`;
        return (
            <div className={className}>
                <EmptyComponent />
            </div>
        );
    }

    render() {
        const {
            onBlur,
            onInvalidate,
            parentContainer,
            data,
            show,
        } = this.props;

        const className = this.getClassName();
        const Empty = this.renderEmpty;

        if (!show) {
            return null;
        }

        return (
            <FloatingContainer
                onBlur={onBlur}
                onInvalidate={onInvalidate}
                parent={parentContainer}
                className={className}
            >
                <List
                    data={data}
                    modifier={this.renderOption}
                />
                <Empty />
            </FloatingContainer>
        );
    }
}
