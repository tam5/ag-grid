// noinspection ES6UnusedImports
import React, {Component} from 'react';
import {AgGridReact} from '../agGridReact';

import {ensureGridApiHasBeenSet, htmlForSelector} from "./utils";

import {mount} from 'enzyme';

let component = null;
let agGridReact = null;

beforeEach((done) => {
    component = mount((<GridComponent/>));
    agGridReact = component.find(AgGridReact).instance();
    // don't start our tests until the grid is ready
    ensureGridApiHasBeenSet(component).then(() => setTimeout(() => done(), 20), () => fail("Grid API not set within expected time limits"));

});

afterEach(() => {
    component.unmount();
    agGridReact = null;
});

it('null value cell renderer test', () => {
    const renderedOutput = component.render();
    const cells = htmlForSelector(renderedOutput, 'div .ag-react-container');

    expect(cells.length).toEqual(2);
    expect(cells[0]).toEqual('10');
    expect(cells[1]).toEqual('');
});

const CellRenderer = props => <>{props.value}</>;

class GridComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnDefs: [
                {
                    field: "value",
                    cellRenderer: "cellRenderer"
                }
            ],
            rowData: [
                {
                    value: 10
                },
                {
                    value: null
                }

            ]


        };
    }

    onGridReady(params) {
        this.api = params.api;
    }

    render() {
        return (
            <div
                className="ag-theme-balham"
                style={{height: 100}}>
                <AgGridReact
                    columnDefs={this.state.columnDefs}
                    onGridReady={this.onGridReady.bind(this)}
                    rowData={this.state.rowData}
                    frameworkComponents={{
                        cellRenderer: CellRenderer
                    }}/>
            </div>
        );
    }
}
