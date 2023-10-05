/* Disable warning that hooks can be used only in components */
/* eslint-disable react-hooks/rules-of-hooks */

import { createElement, ReactElement, ReactNode, useCallback } from "react";
import { Table } from "./components/Table";
import { ColumnsPreviewType, DatagridPreviewProps } from "typings/DatagridProps";
import { parseStyle } from "@mendix/widget-plugin-platform/preview/parse-style";
import { Selectable } from "mendix/preview/Selectable";
import { ObjectItem, GUID } from "mendix";
import { selectionSettings, useOnSelectProps } from "./features/selection";
import { Cell } from "./components/Cell";
import { GridColumn } from "./typings/GridColumn";
import { ColumnPreview } from "./helpers/ColumnPreview";
// Fix type definition for Selectable
// TODO: Open PR to fix in appdev.
declare module "mendix/preview/Selectable" {
    interface SelectableProps<T> {
        object: T;
        caption?: string;
        children: ReactNode;
    }
}

const initColumns: ColumnsPreviewType[] = [
    {
        header: "Column",
        tooltip: "",
        attribute: "No attribute selected",
        width: "autoFill",
        columnClass: "",
        filter: { renderer: () => <div />, widgetCount: 0 },
        resizable: false,
        showContentAs: "attribute",
        content: { renderer: () => <div />, widgetCount: 0 },
        dynamicText: "Dynamic Text",
        draggable: false,
        hidable: "no",
        visible: "true",
        size: 1,
        sortable: false,
        alignment: "left",
        wrapText: false,
        filterAssociation: "",
        filterAssociationOptions: {},
        filterAssociationOptionLabel: ""
    }
];

export function preview(props: DatagridPreviewProps): ReactElement {
    const EmptyPlaceholder = props.emptyPlaceholder.renderer;
    const selectActionProps = useOnSelectProps(undefined);
    const { selectionStatus, selectionMethod } = selectionSettings(props, undefined);
    const data: ObjectItem[] = Array.from({ length: props.pageSize ?? 5 }).map((_, index) => ({
        id: String(index) as GUID
    }));
    const gridId = Date.now().toString();
    const previewColumns: ColumnsPreviewType[] = props.columns.length > 0 ? props.columns : initColumns;
    const columns: GridColumn[] = previewColumns.map((col, index) => new ColumnPreview(col, index, gridId));
    return (
        <Table
            CellComponent={Cell}
            className={props.class}
            columns={columns}
            columnsDraggable={props.columnsDraggable}
            columnsFilterable={props.columnsFilterable}
            columnsHidable={props.columnsHidable}
            columnsResizable={props.columnsResizable}
            columnsSortable={props.columnsSortable}
            data={data}
            emptyPlaceholderRenderer={useCallback(
                (renderWrapper: (children: ReactNode) => ReactElement) => (
                    <EmptyPlaceholder caption="Empty list message: Place widgets here">
                        {renderWrapper(null)}
                    </EmptyPlaceholder>
                ),
                [EmptyPlaceholder]
            )}
            filterRenderer={useCallback(
                (renderWrapper, columnIndex) => {
                    const column = previewColumns[columnIndex];
                    return column.filter ? (
                        <column.filter.renderer caption="Place filter widget here">
                            {renderWrapper(null)}
                        </column.filter.renderer>
                    ) : (
                        renderWrapper(null)
                    );
                },
                [previewColumns]
            )}
            gridHeaderWidgets={
                <props.filtersPlaceholder.renderer caption="Place widgets like filter widget(s) and action button(s) here">
                    <div />
                </props.filtersPlaceholder.renderer>
            }
            hasMoreItems={false}
            headerWrapperRenderer={selectableWrapperRenderer(previewColumns)}
            isSelected={selectActionProps.isSelected}
            numberOfItems={5}
            onSelect={selectActionProps.onSelect}
            onSelectAll={selectActionProps.onSelectAll}
            page={0}
            pageSize={props.pageSize ?? 5}
            paging={props.pagination === "buttons"}
            pagingPosition={props.pagingPosition}
            preview
            selectionMethod={selectionMethod}
            selectionStatus={selectionStatus}
            styles={parseStyle(props.style)}
            valueForSort={useCallback(() => undefined, [])}
        />
    );
}

const selectableWrapperRenderer =
    (columns: ColumnsPreviewType[]) =>
    (columnIndex: number, header: ReactElement): ReactElement => {
        const column = columns[columnIndex];

        // We can't use Selectable when there no columns configured yet, so, just show header.
        if (columns === initColumns) {
            return header;
        }

        return (
            <Selectable
                key={`selectable_column_${columnIndex}`}
                caption={column.header.trim().length > 0 ? column.header : "[Empty caption]"}
                object={column}
            >
                {header}
            </Selectable>
        );
    };

export function getPreviewCss(): string {
    return require("./ui/DatagridPreview.scss");
}
