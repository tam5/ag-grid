var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, AgDialog, Autowired, ChartType, Component, Events, PostConstruct, RefSelector } from "@ag-grid-community/core";
import { ChartMenu } from "./menu/chartMenu";
import { TitleEdit } from "./titleEdit";
import { ChartController } from "./chartController";
import { ChartDataModel } from "./chartDataModel";
import { BarChartProxy } from "./chartProxies/cartesian/barChartProxy";
import { AreaChartProxy } from "./chartProxies/cartesian/areaChartProxy";
import { LineChartProxy } from "./chartProxies/cartesian/lineChartProxy";
import { PieChartProxy } from "./chartProxies/polar/pieChartProxy";
import { DoughnutChartProxy } from "./chartProxies/polar/doughnutChartProxy";
import { ScatterChartProxy } from "./chartProxies/cartesian/scatterChartProxy";
import { HistogramChartProxy } from "./chartProxies/cartesian/histogramChartProxy";
var GridChartComp = /** @class */ (function (_super) {
    __extends(GridChartComp, _super);
    function GridChartComp(params) {
        var _this = _super.call(this, GridChartComp.TEMPLATE) || this;
        _this.params = params;
        return _this;
    }
    GridChartComp.prototype.init = function () {
        var availableChartThemes = this.gridOptionsWrapper.getChartThemes();
        if (availableChartThemes.length < 1) {
            throw new Error('Cannot create chart: no chart themes are available to be used.');
        }
        var chartThemeName = this.params.chartThemeName;
        if (!_.includes(availableChartThemes, chartThemeName)) {
            chartThemeName = availableChartThemes[0];
        }
        var modelParams = {
            pivotChart: this.params.pivotChart,
            chartType: this.params.chartType,
            chartThemeName: chartThemeName,
            aggFunc: this.params.aggFunc,
            cellRange: this.params.cellRange,
            suppressChartRanges: this.params.suppressChartRanges,
            unlinkChart: this.params.unlinkChart,
            crossFiltering: this.params.crossFiltering,
        };
        var isRtl = this.gridOptionsWrapper.isEnableRtl();
        _.addCssClass(this.getGui(), isRtl ? 'ag-rtl' : 'ag-ltr');
        this.model = this.createBean(new ChartDataModel(modelParams));
        this.chartController = this.createManagedBean(new ChartController(this.model));
        this.validateCustomThemes();
        // create chart before dialog to ensure dialog is correct size
        this.createChart();
        if (this.params.insideDialog) {
            this.addDialog();
        }
        this.addMenu();
        this.addTitleEditComp();
        this.addManagedListener(this.getGui(), 'focusin', this.setActiveChartCellRange.bind(this));
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_UPDATED, this.refresh.bind(this));
        if (this.chartMenu) {
            // chart menu may not exist, i.e. cross filtering
            this.addManagedListener(this.chartMenu, ChartMenu.EVENT_DOWNLOAD_CHART, this.downloadChart.bind(this));
        }
        this.refresh();
        this.raiseChartCreatedEvent();
    };
    GridChartComp.prototype.validateCustomThemes = function () {
        var suppliedThemes = this.gridOptionsWrapper.getChartThemes();
        var customChartThemes = this.gridOptionsWrapper.getCustomChartThemes();
        if (customChartThemes) {
            _.getAllKeysInObjects([customChartThemes]).forEach(function (customThemeName) {
                if (!_.includes(suppliedThemes, customThemeName)) {
                    console.warn("AG Grid: a custom chart theme with the name '" + customThemeName + "' has been " +
                        "supplied but not added to the 'chartThemes' list");
                }
            });
        }
    };
    GridChartComp.prototype.createChart = function () {
        var _this = this;
        var width, height;
        // if chart already exists, destroy it and remove it from DOM
        if (this.chartProxy) {
            var chart = this.chartProxy.getChart();
            if (chart) {
                // preserve existing width/height
                width = chart.width;
                height = chart.height;
            }
            this.chartProxy.destroy();
        }
        var processChartOptionsFunc = this.params.processChartOptions || this.gridOptionsWrapper.getProcessChartOptionsFunc();
        var customChartThemes = this.gridOptionsWrapper.getCustomChartThemes();
        var chartType = this.model.getChartType();
        var isGrouping = this.model.isGrouping();
        var crossFilterCallback = function (event, reset) {
            var ctx = _this.params.crossFilteringContext;
            ctx.lastSelectedChartId = reset ? '' : _this.model.getChartId();
            _this.crossFilter.filter(event, reset);
        };
        var chartProxyParams = {
            chartId: this.model.getChartId(),
            chartType: chartType,
            chartThemeName: this.model.getChartThemeName(),
            processChartOptions: processChartOptionsFunc,
            getChartThemeName: this.getChartThemeName.bind(this),
            getChartThemes: this.getChartThemes.bind(this),
            customChartThemes: customChartThemes,
            getGridOptionsChartThemeOverrides: this.getGridOptionsChartThemeOverrides.bind(this),
            apiChartThemeOverrides: this.params.chartThemeOverrides,
            allowPaletteOverride: !this.params.chartThemeName,
            isDarkTheme: this.environment.isThemeDark.bind(this.environment),
            crossFiltering: this.params.crossFiltering,
            crossFilterCallback: crossFilterCallback,
            parentElement: this.eChart,
            width: width,
            height: height,
            grouping: isGrouping,
            document: this.gridOptionsWrapper.getDocument(),
            eventService: this.eventService,
            gridApi: this.gridApi,
            columnApi: this.columnApi,
        };
        // set local state used to detect when chart changes
        this.chartType = chartType;
        this.chartThemeName = this.model.getChartThemeName();
        this.chartProxy = GridChartComp.createChartProxy(chartProxyParams);
        if (!this.chartProxy) {
            console.warn('AG Grid: invalid chart type supplied: ', chartProxyParams.chartType);
            return;
        }
        this.titleEdit && this.titleEdit.setChartProxy(this.chartProxy);
        var canvas = this.eChart.querySelector('canvas');
        if (canvas) {
            _.addCssClass(canvas, 'ag-charts-canvas');
        }
        this.chartController.setChartProxy(this.chartProxy);
    };
    GridChartComp.prototype.getChartThemeName = function () {
        return this.chartController.getThemeName();
    };
    GridChartComp.prototype.getChartThemes = function () {
        return this.chartController.getThemes();
    };
    GridChartComp.prototype.getGridOptionsChartThemeOverrides = function () {
        return this.gridOptionsWrapper.getChartThemeOverrides();
    };
    GridChartComp.createChartProxy = function (chartProxyParams) {
        switch (chartProxyParams.chartType) {
            case ChartType.Column:
            case ChartType.Bar:
            case ChartType.GroupedColumn:
            case ChartType.StackedColumn:
            case ChartType.NormalizedColumn:
            case ChartType.GroupedBar:
            case ChartType.StackedBar:
            case ChartType.NormalizedBar:
                return new BarChartProxy(chartProxyParams);
            case ChartType.Pie:
                return new PieChartProxy(chartProxyParams);
            case ChartType.Doughnut:
                return new DoughnutChartProxy(chartProxyParams);
            case ChartType.Area:
            case ChartType.StackedArea:
            case ChartType.NormalizedArea:
                return new AreaChartProxy(chartProxyParams);
            case ChartType.Line:
                return new LineChartProxy(chartProxyParams);
            case ChartType.Scatter:
            case ChartType.Bubble:
                return new ScatterChartProxy(chartProxyParams);
            case ChartType.Histogram:
                return new HistogramChartProxy(chartProxyParams);
        }
    };
    GridChartComp.prototype.addDialog = function () {
        var _this = this;
        var title = this.chartTranslator.translate(this.params.pivotChart ? 'pivotChartTitle' : 'rangeChartTitle');
        var _a = this.getBestDialogSize(), width = _a.width, height = _a.height;
        this.chartDialog = new AgDialog({
            resizable: true,
            movable: true,
            maximizable: true,
            title: title,
            width: width,
            height: height,
            component: this,
            centered: true,
            closable: true
        });
        this.getContext().createBean(this.chartDialog);
        this.chartDialog.addEventListener(AgDialog.EVENT_DESTROYED, function () { return _this.destroy(); });
    };
    GridChartComp.prototype.getBestDialogSize = function () {
        var popupParent = this.popupService.getPopupParent();
        var maxWidth = _.getAbsoluteWidth(popupParent) * 0.75;
        var maxHeight = _.getAbsoluteHeight(popupParent) * 0.75;
        var ratio = 0.553;
        var _a = this.chartProxy.getChartOptions(), width = _a.width, height = _a.height;
        if (width && height) {
            return { width: width, height: height };
        }
        var chart = this.chartProxy.getChart();
        width = this.params.insideDialog ? 850 : chart.width;
        height = this.params.insideDialog ? 470 : chart.height;
        if (width > maxWidth || height > maxHeight) {
            width = Math.min(width, maxWidth);
            height = Math.round(width * ratio);
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.min(width, Math.round(height / ratio));
            }
        }
        return { width: width, height: height };
    };
    GridChartComp.prototype.addMenu = function () {
        if (!this.params.crossFiltering) {
            this.chartMenu = this.createBean(new ChartMenu(this.eChartContainer, this.eMenuContainer, this.chartController));
            this.eChartContainer.appendChild(this.chartMenu.getGui());
        }
    };
    GridChartComp.prototype.addTitleEditComp = function () {
        this.titleEdit = this.createBean(new TitleEdit(this.chartMenu));
        this.eTitleEditContainer.appendChild(this.titleEdit.getGui());
        if (this.chartProxy) {
            this.titleEdit.setChartProxy(this.chartProxy);
        }
    };
    GridChartComp.prototype.refresh = function () {
        if (this.shouldRecreateChart()) {
            this.createChart();
        }
        this.updateChart();
    };
    GridChartComp.prototype.shouldRecreateChart = function () {
        return this.chartType !== this.model.getChartType() || this.chartThemeName !== this.model.getChartThemeName();
    };
    GridChartComp.prototype.getCurrentChartType = function () {
        return this.chartType;
    };
    GridChartComp.prototype.getChartModel = function () {
        return this.chartController.getChartModel();
    };
    GridChartComp.prototype.updateChart = function () {
        var _this = this;
        var _a = this, model = _a.model, chartProxy = _a.chartProxy;
        var selectedCols = model.getSelectedValueColState();
        var fields = selectedCols.map(function (c) { return ({ colId: c.colId, displayName: c.displayName }); });
        var data = model.getData();
        var chartEmpty = this.handleEmptyChart(data, fields);
        if (chartEmpty) {
            return;
        }
        var selectedDimension = model.getSelectedDimension();
        var chartUpdateParams = {
            data: data,
            grouping: model.isGrouping(),
            category: {
                id: selectedDimension.colId,
                name: selectedDimension.displayName,
                chartDataType: this.getChartDataType(selectedDimension.colId)
            },
            fields: fields,
            chartId: this.model.getChartId(),
            getCrossFilteringContext: function () { return _this.params.crossFilteringContext; },
        };
        chartProxy.update(chartUpdateParams);
        this.titleEdit.setChartProxy(this.chartProxy);
    };
    GridChartComp.prototype.getChartDataType = function (colId) {
        var column = this.columnController.getPrimaryColumn(colId);
        return column ? column.getColDef().chartDataType : undefined;
    };
    GridChartComp.prototype.handleEmptyChart = function (data, fields) {
        var container = this.chartProxy.getChart().container;
        var pivotModeDisabled = this.model.isPivotChart() && !this.model.isPivotMode();
        var minFieldsRequired = 1;
        if (this.chartController.isActiveXYChart()) {
            minFieldsRequired = this.model.getChartType() === ChartType.Bubble ? 3 : 2;
        }
        var isEmptyChart = fields.length < minFieldsRequired || data.length === 0;
        if (container) {
            var isEmpty = pivotModeDisabled || isEmptyChart;
            _.setDisplayed(this.eChart, !isEmpty);
            _.setDisplayed(this.eEmpty, isEmpty);
        }
        if (pivotModeDisabled) {
            this.eEmpty.innerText = this.chartTranslator.translate('pivotChartRequiresPivotMode');
            return true;
        }
        if (isEmptyChart) {
            this.eEmpty.innerText = this.chartTranslator.translate('noDataToChart');
            return true;
        }
        return false;
    };
    GridChartComp.prototype.downloadChart = function () {
        this.chartProxy.downloadChart();
    };
    GridChartComp.prototype.getUnderlyingChart = function () {
        return this.chartProxy.getChart();
    };
    GridChartComp.prototype.refreshCanvasSize = function () {
        if (!this.params.insideDialog) {
            return;
        }
        var _a = this, chartProxy = _a.chartProxy, eChart = _a.eChart;
        if (this.chartMenu.isVisible()) {
            // we don't want the menu showing to affect the chart options
            var chart = this.chartProxy.getChart();
            chart.height = _.getInnerHeight(eChart);
            chart.width = _.getInnerWidth(eChart);
        }
        else {
            chartProxy.setChartOption('width', _.getInnerWidth(eChart));
            chartProxy.setChartOption('height', _.getInnerHeight(eChart));
        }
    };
    GridChartComp.prototype.setActiveChartCellRange = function (focusEvent) {
        if (this.getGui().contains(focusEvent.relatedTarget)) {
            return;
        }
        this.chartController.setChartRange(true);
        this.gridApi.focusController.clearFocusedCell();
    };
    GridChartComp.prototype.raiseChartCreatedEvent = function () {
        var chartModel = this.chartController.getChartModel();
        var event = Object.freeze({
            type: Events.EVENT_CHART_CREATED,
            chartId: chartModel.chartId,
            chartModel: chartModel,
            api: this.gridApi,
            columnApi: this.columnApi,
        });
        this.eventService.dispatchEvent(event);
    };
    GridChartComp.prototype.raiseChartDestroyedEvent = function () {
        var event = Object.freeze({
            type: Events.EVENT_CHART_DESTROYED,
            chartId: this.model.getChartId(),
            api: this.gridApi,
            columnApi: this.columnApi,
        });
        this.eventService.dispatchEvent(event);
    };
    GridChartComp.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.chartProxy) {
            this.chartProxy.destroy();
        }
        this.destroyBean(this.chartMenu);
        // don't want to invoke destroy() on the Dialog (prevents destroy loop)
        if (this.chartDialog && this.chartDialog.isAlive()) {
            this.destroyBean(this.chartDialog);
        }
        // if the user is providing containers for the charts, we need to clean up, otherwise the old chart
        // data will still be visible although the chart is no longer bound to the grid
        var eGui = this.getGui();
        _.clearElement(eGui);
        // remove from parent, so if user provided container, we detach from the provided dom element
        _.removeFromParent(eGui);
        this.raiseChartDestroyedEvent();
    };
    GridChartComp.TEMPLATE = "<div class=\"ag-chart\" tabindex=\"-1\">\n            <div ref=\"eChartContainer\" tabindex=\"-1\" class=\"ag-chart-components-wrapper\">\n                <div ref=\"eChart\" class=\"ag-chart-canvas-wrapper\"></div>\n                <div ref=\"eEmpty\" class=\"ag-chart-empty-text ag-unselectable\"></div>\n            </div>\n            <div ref=\"eTitleEditContainer\"></div>\n            <div ref=\"eMenuContainer\" class=\"ag-chart-docked-container\"></div>\n        </div>";
    __decorate([
        RefSelector('eChart')
    ], GridChartComp.prototype, "eChart", void 0);
    __decorate([
        RefSelector('eChartContainer')
    ], GridChartComp.prototype, "eChartContainer", void 0);
    __decorate([
        RefSelector('eMenuContainer')
    ], GridChartComp.prototype, "eMenuContainer", void 0);
    __decorate([
        RefSelector('eEmpty')
    ], GridChartComp.prototype, "eEmpty", void 0);
    __decorate([
        RefSelector('eTitleEditContainer')
    ], GridChartComp.prototype, "eTitleEditContainer", void 0);
    __decorate([
        Autowired('environment')
    ], GridChartComp.prototype, "environment", void 0);
    __decorate([
        Autowired('chartTranslator')
    ], GridChartComp.prototype, "chartTranslator", void 0);
    __decorate([
        Autowired('columnController')
    ], GridChartComp.prototype, "columnController", void 0);
    __decorate([
        Autowired('chartCrossFilter')
    ], GridChartComp.prototype, "crossFilter", void 0);
    __decorate([
        Autowired('gridApi')
    ], GridChartComp.prototype, "gridApi", void 0);
    __decorate([
        Autowired('columnApi')
    ], GridChartComp.prototype, "columnApi", void 0);
    __decorate([
        Autowired('popupService')
    ], GridChartComp.prototype, "popupService", void 0);
    __decorate([
        PostConstruct
    ], GridChartComp.prototype, "init", null);
    return GridChartComp;
}(Component));
export { GridChartComp };
