import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './styles.scss';

const propTypeData = PropTypes.arrayOf(
    PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.object,
        PropTypes.array,
    ]),
);

const propTypes = {
    className: PropTypes.string,
    data: propTypeData,

    keySelector: PropTypes.func,
    modifier: PropTypes.func,

    renderer: PropTypes.func,
    rendererClassName: PropTypes.string,

    rendererParams: PropTypes.func,

    defaultItemHeight: PropTypes.number,
    maxIdleTimeout: PropTypes.number,
};

const defaultProps = {
    className: '',
    data: [],
    modifier: undefined,
    keySelector: undefined,
    renderer: undefined,
    rendererClassName: '',
    rendererParams: undefined,

    defaultItemHeight: 18,
    maxIdleTimeout: 200,
};

const getRenderedBoundingClientRect = (reactElement, domElement) => {
    const template = document.createElement('template');
    template.innerHTML = ReactDOMServer.renderToStaticMarkup(reactElement);
    const domEl = template.content.firstChild;
    domElement.appendChild(domEl);
    const bcr = domEl.getBoundingClientRect();
    domElement.removeChild(domEl);
    return bcr;
};

export default class DynamicallyVirtualizedListView extends React.Component {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            containerHeight: undefined,
        };

        this.itemHeights = {};
        this.containerRef = React.createRef();

        this.defaultItemHeight = this.props.defaultItemHeight;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll, true);

        // NOTE: componentDidMount is called before the container is created
        setTimeout(
            () => {
                const {
                    changed,
                    containerHeight,
                } = this.calculateContainerHeight();
                if (changed) {
                    // eslint-disable-next-line react/no-did-mount-set-state
                    this.setState({ containerHeight });
                }
            },
            0,
        );
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll, true);
        window.cancelIdleCallback(this.idleCallback);
    }

    calculateContainerHeight = () => {
        const { current: container } = this.containerRef;

        if (container) {
            const containerBCR = container.getBoundingClientRect();
            const { height: containerHeight } = containerBCR;
            const { containerHeight: containerHeightFromState } = this.state;

            if (containerHeight !== containerHeightFromState) {
                return { changed: true, containerHeight: containerBCR.height };
            }
        }
        return { changed: false };
    }

    handleScroll = (e) => {
        // No need to handle scroll if container doesn't have height
        if (!this.state.containerHeight) {
            return;
        }
        // No need to handle scroll if scroll is not for this container
        const { current: container } = this.containerRef;
        if (e.target !== container) {
            return;
        }
        // No need to handle scroll if scroll has not changed
        const { scrollTop: newContainerScrollTop } = container;
        const { containerScrollTop } = this.state;
        if (containerScrollTop === newContainerScrollTop) {
            return;
        }

        window.cancelIdleCallback(this.idleCallback);
        this.idleCallback = window.requestIdleCallback(
            () => {
                this.setState({ containerScrollTop: container.scrollTop });
            },
            { timeout: this.props.maxIdleTimeout },
        );
    }

    renderItem = (datum, i) => {
        const {
            data,
            keySelector,
            renderer: Renderer,
            rendererClassName: rendererClassNameFromProps,
            rendererParams,
        } = this.props;

        const key = keySelector
            ? keySelector(datum, i)
            : datum;

        const extraProps = rendererParams
            ? rendererParams(key, datum, i, data)
            : undefined;

        const rendererClassName = `
            ${rendererClassNameFromProps}
            ${styles.item}
        `;

        return (
            <Renderer
                className={rendererClassName}
                key={key}
                {...extraProps}
            />
        );
    }

    renderItems = () => {
        const {
            data,
            // defaultItemHeight,
        } = this.props;
        const { containerHeight } = this.state;
        const { current: container } = this.containerRef;

        // If there is no container height or no data, dont' render
        if (!containerHeight || data.length === 0) {
            return null;
        }

        // Render top virtual container
        let topVirtualContainerHeight = 0;
        let renderStartIndex = -1;

        for (let i = 0; i < data.length; i += 1) {
            const newHeight = topVirtualContainerHeight + (
                this.itemHeights[i] || this.defaultItemHeight
            );
            if (newHeight > container.scrollTop) {
                break;
            }
            topVirtualContainerHeight = newHeight;
            renderStartIndex = i;
        }
        const topVirtualContainer = (
            <div
                className={styles.virtualDiv}
                key="virtualized-list-item-start-div"
                style={{ height: `${topVirtualContainerHeight}px` }}
            />
        );
        const offsetFromTopVirtualContainer = container.scrollTop - topVirtualContainerHeight;

        // console.warn('Height of TVC', topVirtualContainerHeight);

        // console.warn('Offset from TVC', offsetFromTopVirtualContainer);

        // Keep rendering until the container is filled up to end
        const visibleItems = [];
        // currentRenderYposition is initially less than or equal to zero
        let currentRenderYposition = topVirtualContainerHeight;
        let renderEndIndex;
        const maxRenderYposition = (
            container.scrollTop + containerHeight + offsetFromTopVirtualContainer
        );
        for (
            let i = renderStartIndex + 1;
            currentRenderYposition < maxRenderYposition && i < data.length;
            i += 1
        ) {
            const item = this.renderItem(data[i], i);
            const itemBCR = getRenderedBoundingClientRect(item, container);
            this.itemHeights[i] = itemBCR.height;
            currentRenderYposition += this.itemHeights[i];

            visibleItems.push(item);
            renderEndIndex = i;
        }
        const offsetFromViewport = currentRenderYposition - containerHeight - container.scrollTop;

        // console.warn('Offset from VP', offsetFromViewport);

        // Render bottom virtual container
        let bottomVirtualContainerHeight = -offsetFromViewport;
        for (let i = renderEndIndex + 1; i < data.length; i += 1) {
            bottomVirtualContainerHeight += this.itemHeights[i] || this.defaultItemHeight;
        }
        bottomVirtualContainerHeight = Math.max(0, bottomVirtualContainerHeight);
        const bottomVirtualContainer = (
            <div
                className={styles.virtualDiv}
                key="virtualized-list-item-end-div"
                style={{ height: `${bottomVirtualContainerHeight}px` }}
            />
        );

        // console.warn('Height of BVC', bottomVirtualContainerHeight);

        // console.warn('-----------');

        const heights = Object.keys(this.itemHeights);
        this.defaultItemHeight = heights.reduce(
            (acc, key) => acc + heights[key],
            0,
        ) / heights.length;

        return [
            topVirtualContainer,
            ...visibleItems,
            bottomVirtualContainer,
        ];
    }

    render() {
        const {
            className: classNameFromProps,
        } = this.props;

        const className = `
            ${classNameFromProps}
            ${styles.dynamicallyVirtualizedListView}
            dynamically-virtualized-list-view
        `;

        const Items = this.renderItems;

        return (
            <div
                ref={this.containerRef}
                className={className}
            >
                <Items />
            </div>
        );
    }
}
