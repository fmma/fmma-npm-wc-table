# Install

`npm i @fmma-npm/wc-table --save`

# Usage

## Without using lit

In HTML file:
```html
<html>
...
<body>
    <fmma-table></fmma-table>
<body>
<html>
```

In typescript file:
```typescript
import '@fmma-npm/wc-table';

interface Row {
    name: string;
    age: number
}

const data: Row[] = [
    ...
];

const fmmaTable = document.querySelector('fmma-table') as FmmaTable<Row>;

fmmaTable.fields = [
    {
        field: 'name',
        title: 'Name'
    },
    {
        field: 'age',
        title: 'Age',
        decimalPlaces: 0
    }
];

fmmaTable.rows = data;

```

## Using lit
```typescript
import { LitElement, html } from 'lit';
import '@fmma-npm/wc-table';

interface Row {
    name: string;
    age: number
}

const data: Row[] = [
    ...
];

const fields = [
    {
        field: 'name',
        title: 'Name'
    },
    {
        field: 'age',
        title: 'Age',
        decimalPlaces: 0
    }
];

export class MyElement extends LitElement {

    override render() {
        return html`
            <fmma-table .rows=${data} .fields=${fields}></fmma-table>
        `
    }
}

```

# Examples

An example is found in the `example` folder.

To run example:

1. `npm i` in folder `wc-table`.
2. `npm i` in folder `example`.
3. Run `npm run build` in folder `example`.
4. Right-click index.html and click "Open with Live Server". This requires the vscode extension "Live Server".