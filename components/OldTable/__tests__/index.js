import React from 'react';
import { shallow, mount } from 'enzyme';
import Table from '../index';

describe('Table', () => {
    const tableHeaders = [
        { key: 'a', label: 'atest', order: 1 },
        { key: 'b', label: 'btest', order: 2 },
    ];
    const tableData = [
        { id: 1, a: 5, b: 67 },
        { id: 2, a: 44, b: 823 },
        { id: 3, a: 44, b: 823 },
        { id: 4, a: 34, b: 1 },
    ];

    const wrapper = shallow(
        <Table
            data={tableData}
            headers={tableHeaders}
            keyExtractor={row => row.id}
        />,
    );

    it('renders properly', () => {
        expect(wrapper.length).toEqual(1);
    });
});

describe('Table', () => {
    const tableHeaders = [
        { key: 'a', label: 'atest', order: 1 },
        { key: 'b', label: 'btest', order: 2 },
        { key: 'c', label: 'ctest', order: 3 },

    ];
    const tableData = [
        { id: 1, a: 5, b: 67 },
        { id: 2, a: 44, b: 823 },
        { id: 3, a: 44, b: 823 },
        { id: 4, a: 34, b: 1 },
    ];

    const wrapper = shallow(
        <Table
            data={tableData}
            headers={tableHeaders}
            keyExtractor={row => row.id}
        />,
    );

    it('renders properly when new header added', () => {
        expect(wrapper.length).toEqual(1);
    });
});

describe('Table Header', () => {
    const tableHeaders = [
        {
            key: 'a',
            label: 'atest',
            order: 1,
            sortable: true,
            comparator: (a, b) => a.a - b.a,
        },
        {
            key: 'b',
            label: 'btest',
            order: 2,
            sortable: true,
            comparator: (b, a) => a.b - b.b,
        },
        {
            key: 'c',
            label: 'ctest',
            order: 3,
        },
    ];


    const tableData = [
        { id: 1, a: 5, b: 67, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
    ];

    const ascDataForA = [
        { id: 1, a: 5, b: 67, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
    ];

    const dscDataForA = [
        { id: 4, a: 84, b: 21, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 1, a: 5, b: 67, c: 'ok' },
    ];
    const ascDataForB = [
        { id: 2, a: 44, b: 13, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 1, a: 5, b: 67, c: 'ok' },
    ];

    const dscDataForB = [
        { id: 1, a: 5, b: 67, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
    ];

    const wrapper = mount(
        <Table
            data={tableData}
            headers={tableHeaders}
            keyExtractor={row => row.id}
        />,
    );

    it('sorts properly for header a', () => {
        // console.log(wrapper.state('data'));
        const thead = wrapper.find('thead');
        const th = thead.find('th');
        th.at(0).simulate('click');
        // console.log(wrapper.state('data'));
        expect(wrapper.state('data')).toEqual(dscDataForA);
        th.at(0).simulate('click');
        // console.log(wrapper.state('data'));
        expect(wrapper.state('data')).toEqual(ascDataForA);
    });


    it('sorts properly for header b', () => {
        // console.log(wrapper.state('data'));
        const thead = wrapper.find('thead');
        const th = thead.find('th');
        th.at(1).simulate('click');
        // console.log(wrapper.state('data'));
        expect(wrapper.state('data')).toEqual(dscDataForB);
        th.at(1).simulate('click');
        // console.log(wrapper.state('data'));
        expect(wrapper.state('data')).toEqual(ascDataForB);
    });
});

describe('Table Header', () => {
    const tableHeaders = [
        {
            key: 'a',
            label: 'atest',
            order: 1,
            sortable: true,
            comparator: (a, b) => a.a - b.a,
        },
        {
            key: 'b',
            label: 'btest',
            order: 2,
            sortable: true,
            comparator: (b, a) => a.b - b.b,
        },
        {
            key: 'c',
            label: 'ctest',
            order: 3,
        },
    ];


    const tableData = [
        { id: 1, a: 5, b: 67, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
    ];

    const dscDataForB = [
        { id: 1, a: 5, b: 67, c: 'ok' },
        { id: 3, a: 6, b: 29, c: 'ok' },
        { id: 4, a: 84, b: 21, c: 'ok' },
        { id: 2, a: 44, b: 13, c: 'ok' },
    ];

    const wrapper = mount(
        <Table
            data={tableData}
            headers={tableHeaders}
            keyExtractor={row => row.id}
        />,
    );

    it('sorts properly when first header is removed', () => {
        console.log(wrapper.state('data'));
        const newHeaders = tableHeaders.slice(1, tableHeaders.length);
        // console.log(newHeaders);
        wrapper.setProps({
            data: tableData,
            headers: newHeaders,
        });
        const thead = wrapper.find('thead');
        const th = thead.find('th');
        th.at(1).simulate('click');
        console.log(wrapper.state('data'));
        expect(wrapper.state('data')).toEqual(dscDataForB);
        th.at(1).simulate('click');
        console.log(wrapper.state('data'));
        // expect(wrapper.state('data')).toEqual(ascDataForB);
    });
});