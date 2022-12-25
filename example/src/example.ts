import { html } from 'lit';
import '@fmma-npm/wc-table';
import { FmmaTable, StringKeyOf } from '@fmma-npm/wc-table';

const elt = document.querySelector('fmma-table') as FmmaTable<Data>

const data = [
    { x: 10, y: new Date(2018, 10, 10), "very-long-property-name": 'hello-world' },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
    { x: 20, y: new Date(2022, 2, 2) },
    { x: -30, y: new Date(2010, 2, 2) },
].map((x, i) => ({ ...x, i, texttext: 'text text text text text text ' + i }));

type Data = (typeof data)[number];

elt.fields = [
    {
        field: 'i',
        decimalPlaces: 0
    },
    {
        field: 'x',
        render: (row, i) => html`
            <input .value=${String(row.x)} style="text-align:right; width:100px;" @change=${(e: Event) => {
            const input = e.composedPath()[0] as HTMLInputElement;
            row.x = +input.value;
            elt.requestUpdate();
        }}> kr.
        `
    },
    {
        field: 'y'
    },
    {
        field: 'texttext'
    },
    {
        field: 'very-long-property-name'
    }
]

elt.rows = data

elt.add = () => {
    elt.rows = [{ x: 9999, y: new Date(), texttext: '', i: 9999 }, ...elt.rows];
}

elt.delete = is => {
    elt.rows = elt.rows.filter((_, i) => !is.includes(i));
}