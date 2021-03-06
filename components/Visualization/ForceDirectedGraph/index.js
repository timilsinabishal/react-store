import React from 'react';
import { select, event } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { drag } from 'd3-drag';
import { extent } from 'd3-array';
import { voronoi } from 'd3-voronoi';
import { PropTypes } from 'prop-types';
import SvgSaver from 'svgsaver';
import Responsive from '../../General/Responsive';
import { getStandardFilename, isObjectEmpty } from '../../../utils/common';

// FIXME: don't use globals
// eslint-disable-next-line no-unused-vars
import styles from './styles.scss';
/**
 * boundingClientRect: the width and height of the container.
 * data: the object containing array of nodes and links.
 * idSelector: returns the id of each node.
 * groupSelector: return the group which each nodes belong to.
 * valueSelector: returns the value of each link.
 * useVoronoi: use Voronoi clipping for nodes.
 * circleRadius: The radius of the circle
 * colorScheme: the array of hex color values.
 * className: additional class name for styling.
 * margins: the margin object with properties for the four sides(clockwise from top).
 */
const propTypes = {
    boundingClientRect: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    data: PropTypes.shape({
        nodes: PropTypes.arrayOf(PropTypes.object),
        links: PropTypes.arrayOf(PropTypes.object),
    }),
    setSaveFunction: PropTypes.func,
    idSelector: PropTypes.func.isRequired,
    groupSelector: PropTypes.func,
    valueSelector: PropTypes.func,
    circleRadius: PropTypes.number,
    useVoronoi: PropTypes.bool,
    className: PropTypes.string,
    colorScheme: PropTypes.arrayOf(PropTypes.string),
    margins: PropTypes.shape({
        top: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
    }),
};

const defaultProps = {
    data: {
        nodes: [],
        links: [],
    },
    setSaveFunction: () => {},
    groupSelector: d => d.index,
    valueSelector: () => 1,
    circleRadius: 30,
    useVoronoi: true,
    className: '',
    colorScheme: schemePaired,
    margins: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
};
/**
 * Represents the  network of nodes in force layout with many-body force.
 */

class ForceDirectedGraph extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        if (props.setSaveFunction) {
            props.setSaveFunction(this.save);
        }
        this.state = {
            value: 5,
        };
    }

    componentDidMount() {
        this.renderChart();
        this.updateData(this.props);
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.updateData(nextProps);
        }
    }

    componentDidUpdate() {
        this.renderChart();
    }

    updateData(props) {
        this.data = JSON.parse(JSON.stringify(props.data));
    }

    save = () => {
        const svg = select(this.svg);
        const svgsaver = new SvgSaver();
        svgsaver.asSvg(svg.node(), `${getStandardFilename('forceddirectedgraph', 'graph')}.svg`);
    }

    handleChange = (eve) => {
        this.setState({
            value: eve.target.value,
        });
        this.updateData(this.props);
    }

    renderChart() {
        const {
            boundingClientRect,
            idSelector,
            groupSelector,
            valueSelector,
            circleRadius,
            colorScheme,
            useVoronoi,
            margins,
        } = this.props;
        const { data } = this;

        const svg = select(this.svg);
        svg.selectAll('*').remove();

        select(this.container)
            .selectAll('.tooltip')
            .remove();

        if (!boundingClientRect.width) {
            return;
        }
        if (!data || data.length === 0 || isObjectEmpty(data)) {
            return;
        }
        let { width, height } = boundingClientRect;
        const {
            top,
            right,
            bottom,
            left,
        } = margins;

        const tooltip = select(this.container)
            .append('div')
            .attr('class', 'tooltip')
            .style('display', 'none')
            .style('z-index', 10);

        width = width - left - right;
        height = height - top - bottom;

        const radius = Math.min(width, height) / 2;

        const distance = scaleLinear()
            .domain([1, 10])
            .range([1, radius / 2]);

        const group = svg
            .append('g')
            .attr('transform', `translate(${left}, ${top})`);

        const color = scaleOrdinal().range(colorScheme);

        const minmax = extent(data.links, valueSelector);
        const scaledValues = scaleLinear().domain(minmax).range([1, 3]);

        const voronois = voronoi()
            .x(d => d.x)
            .y(d => d.y)
            .extent([[-10, -10], [width + 10, height + 10]]);

        function recenterVoronoi(nodes) {
            const shapes = [];
            voronois.polygons(nodes).forEach((d) => {
                if (!d.length) return;
                const n = [];
                d.forEach((c) => {
                    n.push([c[0] - d.data.x, c[1] - d.data.y]);
                });
                n.data = d.data;
                shapes.push(n);
            });
            return shapes;
        }

        const simulation = forceSimulation()
            .force('link', forceLink().id(d => idSelector(d)).distance(distance(this.state.value)))
            .force('charge', forceManyBody())
            .force('center', forceCenter(width / 2, height / 2));

        function hideTooltip() {
            tooltip.transition().style('display', 'none');
        }

        function dragstarted(d) {
            hideTooltip();
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;// eslint-disable-line
            d.fy = d.y;// eslint-disable-line
        }

        function dragged(d) {
            hideTooltip();
            d.fx = event.x;// eslint-disable-line
            d.fy = event.y;// eslint-disable-line
        }

        function dragended(d) {
            hideTooltip();
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;// eslint-disable-line
            d.fy = null;// eslint-disable-line
        }

        function mouseOverCircle(d) {
            tooltip.html(`<span class="name">${idSelector(d)}</span>`);
            return tooltip
                .transition()
                .duration(100)
                .style('display', 'inline-block');
        }

        function mouseMoveCircle() {
            return tooltip
                .style('top', `${event.pageY - 30}px`)
                .style('left', `${event.pageX + 20}px`);
        }

        function mouseOutCircle() {
            return tooltip
                .transition()
                .duration(100)
                .style('display', 'none');
        }

        const link = group
            .append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .enter()
            .append('line')
            .attr('stroke-width', d => scaledValues(valueSelector(d)));

        const node = group
            .selectAll('.nodes')
            .data(data.nodes)
            .enter()
            .append('g')
            .attr('class', 'nodes')
            .call(drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('mouseover', mouseOverCircle)
            .on('mousemove', mouseMoveCircle)
            .on('mouseout', mouseOutCircle);

        if (useVoronoi) {
            node
                .append('circle')
                .attr('class', 'circle')
                .attr('r', circleRadius)
                .attr('fill', d => color(groupSelector(d)));

            node
                .append('circle')
                .attr('r', 3)
                .attr('fill', 'black');
        } else {
            node
                .append('circle')
                .attr('r', 5)
                .attr('fill', d => color(groupSelector(d)));
        }

        function ticked() {
            node.each((d) => {
                d.x = Math.max(circleRadius, Math.min(width - circleRadius, d.x)); // eslint-disable-line
                d.y = Math.max(circleRadius, Math.min(height - circleRadius, d.y)); // eslint-disable-line
            });

            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            if (useVoronoi) {
                node
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
                    .attr('clip-path', d => `url(#clip-${d.index})`);

                const clip = group
                    .selectAll('clipPath')
                    .data(recenterVoronoi(node.data()), d => d.data.index);

                clip
                    .enter()
                    .append('clipPath')
                    .attr('id', d => `clip-${d.data.index}`)
                    .attr('class', 'clip');

                clip
                    .exit()
                    .remove();

                clip
                    .selectAll('path')
                    .remove();
                clip
                    .append('path')
                    .attr('d', d => `M${d.join(',')}Z`);
            } else {
                node
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);
            }
        }

        simulation
            .nodes(data.nodes)
            .on('tick', ticked);

        simulation
            .force('link')
            .links(data.links);
    }
    render() {
        return (
            <div
                className={`force-directed-graph-container ${this.props.className}`}
                ref={(el) => { this.container = el; }}
            >
                <input
                    className="input-slider"
                    id="sliderinput"
                    type="range"
                    min="1"
                    max="10"
                    value={this.state.value}
                    onChange={this.handleChange}
                    step="1"
                />
                <svg
                    className="force-directed-graph"
                    ref={(elem) => { this.svg = elem; }}
                />
            </div>
        );
    }
}

export default Responsive(ForceDirectedGraph);
