import React from 'react';
import PropTypes from 'prop-types';

import ListView from '../../List/ListView';

import Cell from '../Cell';

const propTypes = {
    className: PropTypes.string,
    cellClassName: PropTypes.string,
    datum: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    datumKey: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]).isRequired,
    columns: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    columnKeySelector: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

const defaultProps = {
    cellClassName: undefined,
    className: '',
    columns: [],
    datum: {},
    settings: {},
};

export default class Row extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    cellRendererParams = (columnKey, column) => {
        const {
            datum,
            datumKey,
            settings,
            cellClassName,
        } = this.props;

        const {
            cellRendererParams,
            cellRenderer,
        } = column;

        return {
            columnKey,
            datumKey,
            column,
            datum,
            rendererParams: cellRendererParams,
            renderer: cellRenderer,
            settings,
            className: cellClassName,
        };
    }

    render() {
        const {
            columns,
            columnKeySelector,
            className,
        } = this.props;

        return (
            <ListView
                className={className}
                data={columns}
                keyExtractor={columnKeySelector}
                renderer={Cell}
                rendererParams={this.cellRendererParams}
            />
        );
    }
}
