import PropTypes from 'prop-types';
import React from 'react';

const propTypes = {
    tabs: PropTypes.shape({
        dummy: PropTypes.string,
    }),
    useHash: PropTypes.bool,
    defaultHash: PropTypes.string,
    onHashChange: PropTypes.func.isRequired,
};
const defaultProps = {
    tabs: {},
    useHash: false,
    defaultHash: undefined,
};

// NOTE: hash should be similar to '#/metadata'
const setHashToBrowser = hash => window.location.replace(hash);
// NOTE: receives data similar to '#/metadata'
const getHashFromBrowser = () => window.location.hash.substr(2);

export default class HashManager extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static getNewHash = (tabs, defaultHash) => {
        if (defaultHash) {
            return `#/${defaultHash}`;
        }
        const keys = Object.keys(tabs);
        if (keys.length > 0) {
            return `#/${keys[0]}`;
        }
        return undefined;
    }

    constructor(props) {
        super(props);

        if (props.useHash) {
            const hash = getHashFromBrowser();
            props.onHashChange(hash);
        }
    }

    componentDidMount() {
        const { useHash } = this.props;

        if (useHash) {
            window.addEventListener('hashchange', this.handleHashChange);
            this.initializeHash(this.props.tabs, this.props.defaultHash);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {
            tabs: oldTabs,
            useHash: oldUseHash,
        } = this.props;
        const {
            tabs: newTabs,
            useHash: newUseHash,
        } = nextProps;

        if (oldUseHash !== newUseHash) {
            if (newUseHash) {
                window.addEventListener('hashchange', this.handleHashChange);
                this.initializeHash(nextProps.tabs, nextProps.defaultHash);
            } else if (oldUseHash) {
                window.removeEventListener('hashchange', this.handleHashChange);
                this.terminateHash();
            }
        } else if (newUseHash && oldTabs !== newTabs) {
            this.initializeHash(nextProps.tabs, nextProps.defaultHash);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);
    }

    initializeHash = (tabs, defaultHash) => {
        const hash = getHashFromBrowser();

        if (!hash || !tabs[hash]) {
            const newHash = HashManager.getNewHash(
                tabs,
                defaultHash,
            );
            if (newHash) {
                setHashToBrowser(newHash);
            }
        }
    }

    terminateHash = () => {
        this.props.onHashChange(undefined);
    }

    handleHashChange = () => {
        const hash = getHashFromBrowser();
        this.props.onHashChange(hash);
    }

    render() {
        return null;
    }
}
