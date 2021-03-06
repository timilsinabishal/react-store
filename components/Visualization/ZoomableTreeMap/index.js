import React from 'react';
import { select } from 'd3-selection';
import { PropTypes } from 'prop-types';
import {
    scaleLinear,
    scaleOrdinal,
} from 'd3-scale';
import { range } from 'd3-array';
import { hsl, rgb } from 'd3-color';
import { schemeSet3 } from 'd3-scale-chromatic';
import {
    hierarchy,
    treemap,
} from 'd3-hierarchy';
import SvgSaver from 'svgsaver';
import Responsive from '../../General/Responsive';
import {
    getStandardFilename,
    getColorOnBgColor,
    getHexFromRgb,
    isObjectEmpty,
} from '../../../utils/common';

import styles from './styles.scss';

const propTypes = {
    boundingClientRect: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    data: PropTypes.shape({
        name: PropTypes.string,
    }),
    setSaveFunction: PropTypes.func,
    childrenSelector: PropTypes.func,
    valueSelector: PropTypes.func.isRequired,
    labelSelector: PropTypes.func.isRequired,
    colorScheme: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
};

const defaultProps = {
    data: {},
    setSaveFunction: () => {},
    childrenSelector: d => d.children,
    colorScheme: schemeSet3,
    className: '',
};

class ZoomableTreeMap extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        if (props.setSaveFunction) {
            props.setSaveFunction(this.save);
        }
    }

    componentDidMount() {
        this.drawChart();
    }

    componentDidUpdate() {
        this.redrawChart();
    }

    getColorShades = (value) => {
        const { labelSelector } = this.props;
        const parentLabel = labelSelector(value.parent.data);
        const color = this.colors(parentLabel);

        const hslColor = hsl(color);

        hslColor.s = this.saturations(labelSelector(value.data));
        hslColor.l = this.lightness(labelSelector(value.data));
        return hslColor;
    }

    save = () => {
        const svg = select(this.svg);
        const svgsaver = new SvgSaver();
        svgsaver.asSvg(svg.node(), `${getStandardFilename('treemap', 'graph')}.svg`);
    }

    redrawChart = () => {
        const svg = select(this.svg);
        svg.selectAll('*').remove();
        this.drawChart();
    }

    visibility = (d, element) => {
        const textLength = element.getComputedTextLength();
        const elementWidth = (this.x(d.x1) - this.x(d.x0) - 6);
        return textLength < elementWidth ? 1 : 0;
    }

    childLabel = (element) => {
        element
            .attr('x', t => this.x(t.x1) - 6)
            .attr('y', t => this.y(t.y1) - 6)
            .attr('dy', '-.35em')
            .attr('text-anchor', 'end')
            .style('opacity', (d, i, nodes) => this.visibility(d, nodes[i]));
    }

    parentLabel = (element) => {
        element
            .attr('x', d => this.x(d.x0) + 6)
            .attr('y', d => this.y(d.y0) + 6)
            .style('opacity', (d, i, nodes) => this.visibility(d, nodes[i]));
    }

    handleMouseOver = (element) => {
        select(element)
            .transition()
            .attr('opacity', 1);
    }

    handleMouseOut = (element) => {
        select(element)
            .transition()
            .attr('opacity', 0.8);
    }

    drawChart = () => {
        const {
            data,
            childrenSelector,
            boundingClientRect,
            valueSelector,
            colorScheme,
        } = this.props;

        if (!boundingClientRect.width || !data || isObjectEmpty(data)) {
            return;
        }

        const top = 40;

        const { width, height } = boundingClientRect;

        this.x = scaleLinear()
            .domain([0, width])
            .range([0, width]);
        this.y = scaleLinear()
            .domain([0, height - top])
            .range([0, height - top]);

        this.group = select(this.svg)
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(0, ${top})`)
            .style('shape-rendering', 'crispEdges');

        const treemaps = treemap()
            .size([width, height - top])
            .round(true)
            .padding(d => d.height);

        this.colors = scaleOrdinal()
            .range(colorScheme);

        this.saturations = scaleOrdinal()
            .range(range(0.5, 1, 0.1));

        this.lightness = scaleOrdinal()
            .range(range(0.5, 1, 0.1));

        const root = hierarchy(data, childrenSelector)
            .sum(d => valueSelector(d));

        treemaps(root);

        const grandparent = this
            .group
            .append('g')
            .attr('class', `grandparent ${styles.grandparent}`);

        grandparent
            .append('rect')
            .attr('y', -top)
            .attr('width', width)
            .attr('height', top);

        grandparent
            .append('text')
            .attr('x', top / 2)
            .attr('y', -(top / 2))
            .attr('dy', '.32em');

        this.display(root);
        this.transitioning = false;
    }

    display = (d) => {
        const {
            labelSelector,
        } = this.props;

        this.group
            .select('.grandparent')
            .datum(d.parent)
            .on('click', this.transitions)
            .select('text')
            .text(this.name(d));

        this.group
            .select('.grandparent')
            .datum(d.parent)
            .select('rect');

        const first = this.group
            .insert('g', '.grandparent')
            .datum(d)
            .attr('class', 'depth');

        const second = first
            .selectAll('g')
            .data(d.children)
            .enter()
            .append('g');

        second
            .filter(node => node.children)
            .classed(`children ${styles.children}`, true)
            .on('click', this.transitions);

        const children = second
            .selectAll('.child')
            .data(node => node.children || [node])
            .enter()
            .append('g');

        children
            .append('rect')
            .attr('class', `child ${styles.child}`)
            .call(this.rect) // is this required
            .append('title')
            .text(t => `${labelSelector(t.data)}`);

        children
            .append('text')
            .attr('class', `child-label ${styles.childLabel}`)
            .text(t => `${labelSelector(t.data)}`)
            .call(this.childLabel);
        second
            .append('rect')
            .attr('class', `parent ${styles.parent}`)
            .call(this.rect)
            .append('title');

        second
            .append('text')
            .attr('class', `parent-label ${styles.parentLabel}`)
            .attr('dy', '.75em')
            .text(t => `${labelSelector(t.data)}`)
            .call(this.parentLabel);
        second
            .selectAll('rect')
            .style('fill', t => this.getColorShades(t));

        children
            .selectAll('text')
            .style('fill', (t) => {
                const colorBg = getHexFromRgb(rgb(this.getColorShades(t)).toString());
                return getColorOnBgColor(colorBg);
            });

        return second;
    }

    transitions = (d) => {
        if (this.transitioning || !d) return;
        this.transitioning = true;
        const g2 = this.display(d);
        const firstTransition = this.group
            .select('.depth')
            .transition().duration(650);
        const secondTransition = g2.transition().duration(650);
        this.x.domain([d.x0, d.x1]);
        this.y.domain([d.y0, d.y1]);
        this.group.style('shape-rendering', null);
        this.group.selectAll('.depth').sort((a, b) => a.depth - b.depth);
        g2
            .selectAll('text')
            .style('fill-opacity', 0);

        firstTransition
            .selectAll('.parent-label').call(this.parentLabel).style('fill-opacity', 0);
        secondTransition
            .selectAll('.parent-label').call(this.parentLabel).style('fill-opacity', 1);
        firstTransition
            .selectAll('.child-label').call(this.childLabel).style('fill-opacity', 0);
        secondTransition
            .selectAll('.child-label').call(this.childLabel).style('fill-opacity', 1);
        firstTransition
            .selectAll('rect').call(this.rect);
        secondTransition
            .selectAll('rect').call(this.rect);

        firstTransition
            .on('end.remove', (_, i, nodes) => {
                select(nodes[i]).remove();
                this.transitioning = false;
            });
    }

    text = (text) => {
        const { x, y } = this;
        text
            .attr('x', d => x(d.x0) + 6)
            .attr('y', d => y(d.y0) + 6);
    }

    rect = (node) => {
        const { x, y } = this;
        node
            .attr('x', d => x(d.x0))
            .attr('y', d => y(d.y0))
            .attr('width', d => x(d.x1) - x(d.x0))
            .attr('height', d => y(d.y1) - y(d.y0));
    }

    name = (d) => {
        const { labelSelector } = this.props;
        let result = '';
        const separator = ' / ';
        d.ancestors().reverse().forEach((node) => {
            result += labelSelector(node.data) + separator;
        });

        return result
            .split(separator)
            .filter(i => i !== '')
            .join(separator);
    }

    render() {
        const { className } = this.props;

        const treemapStyle = [
            'treemap',
            styles.treemap,
            className,
        ].join(' ');

        return (
            <svg
                className={treemapStyle}
                ref={(elem) => { this.svg = elem; }}
            />
        );
    }
}

export default Responsive(ZoomableTreeMap);
