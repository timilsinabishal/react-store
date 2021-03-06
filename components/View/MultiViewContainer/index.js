import PropTypes from 'prop-types';
import React from 'react';

import List from '../List';
import styles from './styles.scss';

const propTypes = {
    className: PropTypes.string,
    views: PropTypes.shape(PropTypes.Node),
    activeClassName: PropTypes.string,
    containerClassName: PropTypes.string,
    useHash: PropTypes.bool,
    active: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
};

const defaultProps = {
    active: undefined,
    className: '',
    views: {},
    activeClassName: styles.active,
    containerClassName: '',
    useHash: false,
};

export default class MultiViewContainer extends React.Component {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            hash: props.useHash
                ? this.getHash()
                : undefined,
        };

        this.lazyContainers = {};
    }

    componentDidMount() {
        if (this.props.useHash) {
            window.addEventListener('hashchange', this.handleHashChange);
        }
    }

    componentWillReceiveProps(nextProps) {
        const { useHash: newUseHash } = nextProps;
        const { useHash: oldUseHash } = this.props;

        if (newUseHash !== oldUseHash) {
            if (newUseHash) {
                this.setState({ hash: this.getHash() });
                window.addEventListener('hashchange', this.handleHashChange);
            } else {
                window.removeEventListener('hashchange', this.handleHashChange);
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);
    }

    getHash = () => (
        window.location.hash.substr(2)
    )

    getClassName = () => {
        const { className } = this.props;

        const classNames = [
            className,
            'multi-content-view',
        ];

        return classNames.join(' ');
    }

    getContainerClassName = (isActive) => {
        const {
            containerClassName,
            activeClassName,
        } = this.props;

        const classNames = [
            containerClassName,
            styles.container,
        ];

        if (isActive) {
            classNames.push(activeClassName);
        }

        return classNames.join(' ');
    }

    getContentClassName = (isActive) => {
        const { activeClassName } = this.props;
        const classNames = [];

        if (isActive) {
            classNames.push(activeClassName);
        }
    }

    handleHashChange = () => {
        // NOTE: added this because hash wasn't used
        console.warn('Hash has changed from ', this.state.hash, 'to', this.getHash());
        this.setState({ hash: this.getHash() });
    }

    renderContainer = (p) => {
        const {
            view,
            isActive,
            ...otherProps
        } = p;

        const Component = view.component;

        if (view.wrapContainer) {
            const className = this.getContainerClassName(isActive);

            return (
                <div className={className}>
                    <Component
                        {...otherProps}
                    />
                </div>
            );
        }

        const className = this.getContentClassName(isActive);
        return (
            <Component
                className={className}
                {...otherProps}
            />
        );
    }

    renderView = (k, data) => {
        const {
            views,
            active,
            useHash,
        } = this.props;

        const key = data;
        let isActive;

        if (useHash) {
            isActive = this.state.hash === String(key);
        } else {
            isActive = String(active) === String(key);
        }

        const view = views[data];
        const Container = this.renderContainer;
        const { lazyMount } = view;

        if (!view.mount && !isActive) {
            return null;
        }

        if (lazyMount) {
            let LazyContainer = this.lazyContainers[key] || null;

            if (!LazyContainer) {
                if (!isActive) {
                    return null;
                }

                this.lazyContainers[key] = p => <Container {...p} />;
                LazyContainer = this.lazyContainers[key];
            }

            const params = view.rendererParams ? view.rendererParams() : {};
            return (
                <LazyContainer
                    key={key}
                    view={view}
                    isActive={isActive}
                    {...params}
                />
            );
        }

        const params = view.rendererParams ? view.rendererParams() : {};
        return (
            <Container
                key={key}
                view={view}
                isActive={isActive}
                {...params}
            />
        );
    }

    render() {
        const { views } = this.props;
        const viewList = Object.keys(views);

        return (
            <List
                data={viewList}
                modifier={this.renderView}
            />
        );
    }
}
