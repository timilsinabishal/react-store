import React from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import MapContext from './context';

import Message from '../../View/Message';

import styles from './styles.scss';


const nullComponent = () => null;

const propTypes = {
    className: PropTypes.string,
    bounds: PropTypes.arrayOf(PropTypes.number),
    boundsPadding: PropTypes.number,
    fitBoundsDuration: PropTypes.number,
    panelsRenderer: PropTypes.func,
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
};

const defaultProps = {
    className: '',
    bounds: undefined,
    boundsPadding: 64,
    fitBoundsDuration: 1000,
    panelsRenderer: nullComponent,
    children: false,
};

export default class Map extends React.Component {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.mapContainer = React.createRef();
        this.leftBottomPanels = React.createRef();
        this.state = {
            map: undefined,
            zoomLevel: 3,
        };

        this.unsupportedBrowser = !mapboxgl.supported();
        this.childDestroyers = {};
    }

    componentDidMount() {
        if (this.unsupportedBrowser) {
            return;
        }

        this.mounted = true;

        const {
            REACT_APP_MAPBOX_ACCESS_TOKEN: token,
            REACT_APP_MAPBOX_STYLE: style,
        } = process.env;

        // Add the mapbox map
        if (token) {
            mapboxgl.accessToken = token;
        }

        const map = new mapboxgl.Map({
            center: [84.1240, 28.3949],
            container: this.mapContainer.current,
            style,
            zoom: 3,
            minZoom: 3,
            maxZoom: 10,
            logoPosition: 'bottom-right',
            doubleClickZoom: false,
            preserveDrawingBuffer: true,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        map.on('load', () => {
            // Since the map is loaded asynchronously, make sure
            // we are still mounted before doing setState
            if (this.mounted) {
                const { bounds, boundsPadding, fitBoundsDuration } = this.props;
                if (bounds) {
                    map.fitBounds(
                        [[
                            bounds[0],
                            bounds[1],
                        ], [
                            bounds[2],
                            bounds[3],
                        ]],
                        {
                            padding: boundsPadding,
                            duration: fitBoundsDuration,
                        },
                    );
                }

                this.setState({ map });
            }
        });

        map.on('zoom', () => {
            this.setState({
                zoomLevel: map.getZoom(),
            });
        });

        setTimeout(() => { map.resize(); }, 200);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.bounds !== nextProps.bounds && this.state.map) {
            const { bounds } = nextProps;
            const { map } = this.state;
            if (bounds) {
                map.fitBounds(
                    [[
                        bounds[0],
                        bounds[1],
                    ], [
                        bounds[2],
                        bounds[3],
                    ]],
                    { padding: 128 },
                );
            }
        }
    }

    componentWillUnmount() {
        this.mounted = false;

        Object.keys(this.childDestroyers).forEach((key) => {
            this.childDestroyers[key]();
        });

        // Remove the mapbox map
        const { map } = this.state;
        if (map) {
            map.remove();
        }
    }

    setChildDestroyer = (key, destroyer) => {
        this.childDestroyers[key] = destroyer;
    }

    getClassName = () => {
        const { className } = this.props;

        const classNames = [
            className,
            styles.map,
        ];

        return classNames.join(' ');
    }

    renderChildren = childrenProps => (
        <MapContext.Provider value={childrenProps}>
            {this.props.children}
        </MapContext.Provider>
    )

    render() {
        const { panelsRenderer } = this.props;
        const { map } = this.state;

        const className = this.getClassName();
        const Children = this.renderChildren;
        const Panels = panelsRenderer;

        if (this.unsupportedBrowser) {
            return (
                <div
                    className={className}
                    ref={this.mapContainer}
                >
                    <Message>
                        {'Your browser doesn\'t support Mapbox!'}
                    </Message>
                </div>
            );
        }

        return (
            <div
                className={className}
                ref={this.mapContainer}
            >
                {map && (
                    <React.Fragment>
                        <Children
                            map={map}
                            zoomLevel={this.state.zoomLevel}
                            setDestroyer={this.setChildDestroyer}
                        />
                        <div
                            className={styles.leftBottomPanels}
                            ref={this.leftBottomPanels}
                        >
                            <Panels
                                map={map}
                                zoomLevel={this.state.zoomLevel}
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}
