import { html, LitElement, nothing, PropertyValueMap } from "lit";
import { property, customElement, state } from 'lit/decorators.js';

export type StringKeyOf<T> = keyof T & string;

interface Cell<T> {
    row: T;
    field: Field<T>;
    value: any;
    text: string;
    searchText: string;
    sortValue: any;
    classes: string[];
    i: number;
    isLastClicked: boolean;
    editable: boolean;
}

export interface Field<T = any> {
    title?: string;
    field: StringKeyOf<T>;
    unit?: string;
    decimalPlaces?: number;
    align?: 'left' | 'right' | 'center';
    render?: (row: T, i: number) => unknown;
    renderEdit?: (row: T, i: number) => unknown;
    editable?: (row: T, i: number) => boolean;
    renderTitle?: () => unknown;
    tdStyle?: string;
}

@customElement('fmma-table')
export class FmmaTable<T = any> extends LitElement {

    override renderRoot: HTMLElement | ShadowRoot = this;

    @property({ type: Array, attribute: false })
    rows: T[] = [];

    @property({ type: Array, attribute: false })
    fields?: Field<T>[];

    @property({ type: Function })
    delete?: (rowIndices: number[]) => Promise<void> | void;

    @property({ type: Function })
    add?: () => Promise<void> | void;

    get cols(): Field<T>[] {
        if (this.fields == null) {
            const row0 = this.rows[0];
            if (row0 == null)
                return [];
            return stringKeysOfObject(row0).map(x => ({ field: x })).filter(x => !this._hiddenCols.includes(x.field));
        }
        return this.fields.filter(x => !this._hiddenCols.includes(x.field));
    }

    @state()
    private _hiddenCols: (StringKeyOf<T>)[] = [];

    @state()
    private _sortState: { field: StringKeyOf<T>, desc: boolean }[] = [];

    @state()
    private _filterState: { field: StringKeyOf<T>, values: string[] }[] = [];

    @state()
    private _searchText = '';

    @state()
    private _selectedRows: number[] = [];

    @state()
    private _lastClickedCell?: { row: number, field: StringKeyOf<T> };

    protected override updated(_changedProperties: Map<string, any>): void {
        if(_changedProperties.has('_lastClickedCell')) {
            const inputElement = this.renderRoot.querySelector('#fmma-cell-input input, #fmma-cell-input textarea, #fmma-cell-input select') as HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement;
            inputElement?.focus?.();
            (inputElement as HTMLTextAreaElement | HTMLInputElement )?.select?.();
            inputElement?.scroll?.(0,0);
        }
    }

    _events = {
        search: () => {
            const input = document.getElementById("searchinput") as HTMLInputElement;
            this._searchText = input.value.toLocaleLowerCase('da-DK');
        },

        hideCol: (field: Field<T>) => () => {
            this._hiddenCols = [...this._hiddenCols, field.field];
        },

        unhideCol: (fieldField: StringKeyOf<T>) => () => {
            this._hiddenCols = this._hiddenCols.filter(y => fieldField !== y);
        },

        sortCol: (field: Field<T>) => () => {

            const desc = this._sortState.find(y => field.field === y.field)?.desc;

            if (desc == null) {
                this._sortState = [{ field: field.field, desc: true }, ...this._sortState]
            }
            else if (desc) {
                this._sortState = [{ field: field.field, desc: false }, ...this._sortState.filter(x => x.field !== field.field)]
            }
            else {
                this._sortState = this._sortState.filter(x => x.field !== field.field);
            }
        },

        filterCol: (field: Field<T>, value: string) => (event: Event) => {
            const elt = event.composedPath()[0] as HTMLInputElement;
            const checked = elt.checked;

            const values = this._filterState.find(y => field.field === y.field)?.values ?? [];

            if (checked) {

                this._filterState = [...this._filterState.filter(x => x.field !== field.field), { field: field.field, values: [...values.filter(x => x !== value), value] }];
            }
            else {
                const newValues = values.filter(x => x !== value);
                this._filterState = [...this._filterState.filter(x => x.field !== field.field), { field: field.field, values: newValues }];
            }
        },

        filterToggle: (field: Field<T>, values: string[]) => (event: Event) => {
            const active = this._filterState.some(x => x.field === field.field);
            if (active) {
                this._filterState = this._filterState.filter(x => x.field !== field.field);
            }
            else {
                this._filterState = [...this._filterState.filter(x => x.field !== field.field), { field: field.field, values: [] }];
            }
        },

        filterColAll: (field: Field<T>, values: string[]) => (event: Event) => {
            const elt = event.composedPath()[0] as HTMLInputElement;
            const checked = elt.checked;
            this._filterState = [...this._filterState.filter(x => x.field !== field.field), { field: field.field, values: checked ? values : [] }]
        },

        cellClick: (cell: Cell<T>) => (event: MouseEvent) => {
            if(!cell.editable) {
                this._lastClickedCell = undefined;
            }
            else {
                this._lastClickedCell = { field: cell.field.field, row: cell.i };
            }
            if (event.ctrlKey) {
                if (this._selectedRows.includes(cell.i)) {
                    this._selectedRows = this._selectedRows.filter(x => x !== cell.i);

                }
                else {
                    this._selectedRows = [...this._selectedRows, cell.i];
                }
            }
            else {
                this._selectedRows = [cell.i];
            }
        },

        deleteSelected: async () => {
            const is = this._selectedRows;
            this._selectedRows = [];
            await this.delete?.(is);
        },

        addRow: async () => {
            await this.add?.();
        }
    }

    override render() {
        const events = this._events;

        let tableData: Cell<T>[][] = this.rows.map((row, i) => {
            return this.cols.map((field) => {
                const value: any = row[field.field];
                const text = this._renderValue(field, value);
                const isLastClicked = this._lastClickedCell?.field === field.field && this._lastClickedCell.row === i;
                return {
                    row,
                    field,
                    value,
                    text,
                    searchText: text.toLocaleLowerCase('da-DK'),
                    sortValue: this._sortValue(field, value),
                    classes: [
                        this._align(field, value),
                        ...this._selectedRows.includes(i) ? ['fmma-selected'] : [],
                        ...isLastClicked ? ['fmma-cell-selected'] : []
                    ],
                    i,
                    isLastClicked,
                    editable: field.editable?.(row, i) ?? field.renderEdit != null
                };
            })
        });

        if (this._searchText) {
            tableData = tableData.filter(x => x.some(y => y.searchText.includes(this._searchText)));
        }

        const filterValues = this.cols.map((v, i) => {
            const set = new Set(tableData.map(x => x[i].searchText));
            if (set.size === tableData.length) {
                return [];
            }
            return [...set];
        });

        if (this._filterState.length > 0) {
            for (const { field, values } of this._filterState) {
                if (values.length > 0)
                    tableData = tableData.filter(x => values.includes(x.find(y => y.field.field === field)?.searchText ?? ''))
            }
        }

        if (this._sortState.length > 0) {
            tableData.sort(this._getSortFunction)
        }

        return html`
            <style>
                .fmma-table {
                    border: solid 1px #DDEEEE;
                    border-collapse: collapse;
                    border-spacing: 0;
                    font: normal 13px Arial, sans-serif;
                }

                .fmma-table thead th {
                    background-color: #DDEFEF;
                    border: solid 1px #DDEEEE;
                    color: #336B6B;
                    padding: 5px;
                    text-align: center;
                    text-shadow: 1px 1px 1px #fff;
                    min-width: 100px;
                    max-width: 400px;
                }

                .fmma-table tbody td {
                    border: solid 1px #DDEEEE;
                    color: #333;
                    padding: 5px;
                    text-shadow: 1px 1px 1px #fff;
                    max-width: 400px;
                }

                .fmma-table tbody td input {
                    margin: -2px;
                }

                .fmma-table thead th .fmma-table-buttons {
                    display: none;
                    position:absolute;
                    right: 1px;
                    top: 0px;
                }

                .fmma-table thead th:hover .fmma-table-buttons {
                    display: block;
                    background-color: white;
                    border: solid 1px #DDEEEE;
                    border-radius: 2px;
                }

                .fmma-table .fmma-selected {
                    background-color: #DDEFEF;
                }

                .fmma-table .fmma-align-left input {
                    text-align: left;
                }

                .fmma-table .fmma-align-center input {
                    text-align: center;
                }

                .fmma-table .fmma-align-right input {
                    text-align: right;
                }

                .fmma-table .fmma-align-left {
                    text-align: left;
                }

                .fmma-table .fmma-align-center {
                    text-align: center;
                }

                .fmma-table .fmma-align-right {
                    text-align: right;
                }

                .fmma-table .fmma-table-button {
                    border: none;
                    background: rgba(1,1,1,0.1);
                    border-radius: 5px;
                    width: 20px;
                    opacity: 0.25;

                    padding: 2px;
                    margin: 0;
                }

                .fmma-table .fmma-table-button:hover:not([disabled]) {
                    opacity: 1;

                    cursor: pointer;
                }
                .fmma-table .fmma-table-button:focus:not([disabled]) {
                    opacity: 1;
                }

                .fmma-table .fmma-table-filter-values {
                    display:none;
                    background:white;
                    text-align:left;
                    position:absolute;
                    overflow:auto;
                    border: solid 1px #DDEEEE;
                    z-index: 1;
                }

                .fmma-table .fmma-display-block {
                    display: block;
                }

                .fmma-cell-contents {
                    flex-grow: 1;
                    position: relative;
                    white-space: normal;
                }

                #fmma-cell-input > * {
                    width: 100%;
                    height: 100%;
                    min-height: 1em;
                }
            </style>

            <span class="fmma-table-button fa-solid fa-magnifying-glass"></span>
            <input type="text" id="searchinput" @keyup=${events.search} placeholder="Søg her...">

            ${this._hiddenCols.length > 0 ? html`
                <details style="display:inherit; position: absolute; background-color: white; z-index: 1;
                    border: solid 1px #DDEEEE;">
                    <summary>Skjulte kolonner</summary>
                    ${this._hiddenCols.map(x => html`
                    <div>
                        <button class="fmma-table-button fa-solid fa-eye" @click=${events.unhideCol(x)}></button>

                        ${x}
                    </div>
                    `)}
                </details>
            `: nothing}


            <table class="fmma-table">
                <thead>
                    <tr>
                        ${this.cols.map((x, i) => html`
                        <th style="position:relative;">
                            ${x.renderTitle?.() ?? x.title ?? x.field}
                            <div class="fmma-table-buttons">
                                <button class="fmma-table-button fa-solid fa-eye-slash" @click=${events.hideCol(x)}></button>
                                <button class="fmma-table-button fa-solid ${this._getSortIcon(x)}" @click=${events.sortCol(x)}></button>
                                ${this._renderFilterButton(x, filterValues[i])}
                            </div>
                        </th>
                        `)}
                        <th>
                            ${this.delete == null ? nothing : html`<button class="fmma-table-button fa-solid fa-trash" .disabled=${this._selectedRows.length === 0} @click=${events.deleteSelected}></button>`}
                            ${this.add == null ? nothing : html`<button class="fmma-table-button fa-solid fa-plus" @click=${events.addRow}></button>`}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(row => this._renderRow(row))}
                </tbody>
            </table>
        `;
    }

    private _renderFilterButton(x: Field<T>, filterValues: string[]) {
        if (filterValues.length === 0)
            return nothing;

        const events = this._events;
        return html`
            <span class="fmma-table-filter-values-wrapper">
                <button class="fmma-table-button fa-solid ${this._getFilterIcon(x)}" @click=${events.filterToggle(x,
            filterValues)}></button>
                <div
                    class="fmma-table-filter-values ${this._filterState.some(y => y.field === x.field) ? 'fmma-display-block' : ''}">
                    <div style="white-space:nowrap;"><input type="checkbox" @click=${events.filterColAll(x, filterValues)}
                            .checked=${this._getFilterCheckedAll(x, filterValues)}>Vælg alle</div>
                    ${filterValues.map(v => html`
                    <div style="white-space:nowrap;"><input type="checkbox" @click=${events.filterCol(x, v)}
                            .checked=${this._getFilterChecked(x, v)}>${v}</div>
                    `)}
                </div>
            </span>
        `;
    }
    private _getFilterCheckedAll(field: Field<T>, filterValues: string[]): boolean {
        return this._filterState.find(x => x.field === field.field)?.values?.length === filterValues.length;
    }
    private _getFilterChecked(field: Field<T>, v: string): boolean {
        return this._filterState.find(x => x.field === field.field)?.values?.includes(v) ?? false;
    }

    private _getSortIcon(x: Field): string {
        const desc = this._sortState.find(y => x.field === y.field)?.desc;

        if (desc == null) {
            return 'fa-sort';
        }
        return desc ? 'fa-sort-down' : 'fa-sort-up'
    }

    private _getFilterIcon(x: Field): string {
        const values = this._filterState.find(y => x.field === y.field)?.values;

        if (values == null) {
            return 'fa-filter';
        }
        return 'fa-filter-circle-xmark'
    }

    private _renderRow = (row: Cell<T>[]) => {


        const _renderCell = (cell: Cell<T>) => {
            return html`
                <td
                    style="${cell.field.tdStyle ?? ''}"
                    tabindex="${!cell.editable || this._lastClickedCell?.field == cell.field.field && this._lastClickedCell.row == cell.i ? '' : '0'}"
                    class="${cell.classes.join(' ')}"
                    @click=${this._events.cellClick(cell)}
                    @focus=${this._events.cellClick(cell)}
                >
                    <span style="display: flex; flex-direction: row-reverse; white-space: nowrap;">
                        <span style="text-align: left; padding-left: 3px; color: darkgray;">
                            ${cell.field.unit}
                        </span>
                        <span class="fmma-cell-contents">
                            ${cell.editable && cell.isLastClicked ? html`
                                <div
                                    style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; border: 0; background-color: white;"
                                    id="fmma-cell-input"
                                >
                                ${cell.field.renderEdit?.(cell.row, cell.i)}
                                </div>
                            ` : nothing}
                            ${cell.field.render?.(cell.row, cell.i) ?? cell.text}
                        </span>
                    </span>
                </td>
            `;
        };

        return html`
            <tr>
                ${row.map(_renderCell)}
            </tr>
        `;
    }

    private _renderValue(field: Field, x: any): string {
        if (x == null)
            return '';
        if (x instanceof Date) {
            return x.toLocaleString('da-DK').replace(' 00.00.00', '');
        }
        if (typeof x === 'number') {
            return `${x.toFixed(field.decimalPlaces ?? 2)}`;
        }
        return String(x);
    }

    private _sortValue(field: Field, x: any): unknown {
        if (x == null)
            return '';
        return x;
    }

    private _align(field: Field, x: any): 'fmma-align-left' | 'fmma-align-center' | 'fmma-align-right' {
        if (field.align)
            return `fmma-align-${field.align}`;
        if (x == null)
            return 'fmma-align-left';
        if (x instanceof Date) {
            return 'fmma-align-center'
        }
        if (typeof x === 'number') {
            return 'fmma-align-right'
        }
        return 'fmma-align-left';
    }

    private _getSortFunction = (a: Cell<T>[], b: Cell<T>[]) => {

        for (const { field, desc } of this._sortState) {
            const x = a.find(x => x.field.field === field)?.sortValue;
            const y = b.find(x => x.field.field === field)?.sortValue;
            if (x < y) {
                return desc ? 1 : -1;
            }
            else if (x > y) {
                return desc ? -1 : 1;
            }
        }

        if (a[0].i < b[0].i)
            return -1;

        if (a[0].i > b[0].i)
            return 1;

        return 0;
    }

}

function stringKeysOfObject<T = any>(row0: NonNullable<T>): StringKeyOf<T>[] {
    return Object.keys(row0).filter((x): x is StringKeyOf<T> => typeof x === 'string');
}
