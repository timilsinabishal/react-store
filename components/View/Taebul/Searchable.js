import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import memoize from 'memoize-one';

const propTypes = {
    data: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    settings: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    searchFunction: PropTypes.func.isRequired,
};

const defaultProps = {
    data: [],
    settings: {},
};

export default (WrappedComponent) => {
    const SearchedComponent = class extends React.PureComponent {
        static propTypes = propTypes;
        static defaultProps = defaultProps;

        static searchData = memoize((data, searchFunction, searchString) => {
            if (!searchString) {
                return data;
            }
            return data.filter(datum => searchFunction(datum, searchString));
        })

        render() {
            const {
                data,
                settings,
                searchFunction,
                ...otherProps
            } = this.props;

            const newData = SearchedComponent.searchData(
                data,
                searchFunction,
                settings.searchString,
            );

            return (
                <WrappedComponent
                    data={newData}
                    settings={settings}
                    {...otherProps}
                />
            );
        }
    };
    return hoistNonReactStatics(SearchedComponent, WrappedComponent);
};
