var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, ServerSideStoreType } from "@ag-grid-community/core";
import { PartialStore } from "./partialStore";
import { FullStore } from "./fullStore";
var StoreFactory = /** @class */ (function () {
    function StoreFactory() {
    }
    StoreFactory.prototype.createStore = function (ssrmParams, parentNode) {
        var storeParams = this.getStoreParams(ssrmParams, parentNode);
        var CacheClass = storeParams.storeType === ServerSideStoreType.Partial ? PartialStore : FullStore;
        return new CacheClass(ssrmParams, storeParams, parentNode);
    };
    StoreFactory.prototype.getStoreParams = function (ssrmParams, parentNode) {
        var userStoreParams = this.getLevelSpecificParams(parentNode);
        // if user provided overrideParams, we take storeType from there if it exists
        var storeType = this.getStoreType(userStoreParams);
        var cacheBlockSize = this.getBlockSize(storeType, userStoreParams);
        var maxBlocksInCache = this.getMaxBlocksInCache(storeType, ssrmParams, userStoreParams);
        var storeParams = {
            storeType: storeType,
            cacheBlockSize: cacheBlockSize,
            maxBlocksInCache: maxBlocksInCache
        };
        return storeParams;
    };
    StoreFactory.prototype.getMaxBlocksInCache = function (storeType, ssrmParams, userStoreParams) {
        if (storeType == ServerSideStoreType.Full) {
            return undefined;
        }
        var maxBlocksInCache = (userStoreParams && userStoreParams.maxBlocksInCache != null)
            ? userStoreParams.maxBlocksInCache
            : this.gridOptionsWrapper.getMaxBlocksInCache();
        var maxBlocksActive = maxBlocksInCache != null && maxBlocksInCache >= 0;
        if (!maxBlocksActive) {
            return undefined;
        }
        if (ssrmParams.dynamicRowHeight) {
            var message_1 = 'AG Grid: Server Side Row Model does not support Dynamic Row Height and Cache Purging. ' +
                'Either a) remove getRowHeight() callback or b) remove maxBlocksInCache property. Purging has been disabled.';
            _.doOnce(function () { return console.warn(message_1); }, 'storeFactory.maxBlocksInCache.dynamicRowHeight');
            return undefined;
        }
        if (this.columnController.isAutoRowHeightActive()) {
            var message_2 = 'AG Grid: Server Side Row Model does not support Auto Row Height and Cache Purging. ' +
                'Either a) remove colDef.autoHeight or b) remove maxBlocksInCache property. Purging has been disabled.';
            _.doOnce(function () { return console.warn(message_2); }, 'storeFactory.maxBlocksInCache.autoRowHeightActive');
            return undefined;
        }
        return maxBlocksInCache;
    };
    StoreFactory.prototype.getBlockSize = function (storeType, userStoreParams) {
        if (storeType == ServerSideStoreType.Full) {
            return undefined;
        }
        var blockSize = (userStoreParams && userStoreParams.cacheBlockSize != null)
            ? userStoreParams.cacheBlockSize
            : this.gridOptionsWrapper.getCacheBlockSize();
        if (blockSize != null && blockSize > 0) {
            return blockSize;
        }
        else {
            return 100;
        }
    };
    StoreFactory.prototype.getLevelSpecificParams = function (parentNode) {
        var callback = this.gridOptionsWrapper.getServerSideStoreParamsFunc();
        if (!callback) {
            return undefined;
        }
        var params = {
            level: parentNode.level + 1,
            parentRowNode: parentNode.level >= 0 ? parentNode : undefined,
            rowGroupColumns: this.columnController.getRowGroupColumns(),
            pivotColumns: this.columnController.getPivotColumns(),
            pivotMode: this.columnController.isPivotMode()
        };
        return callback(params);
    };
    StoreFactory.prototype.getStoreType = function (storeParams) {
        var storeType = (storeParams && storeParams.storeType != null)
            ? storeParams.storeType
            : this.gridOptionsWrapper.getServerSideStoreType();
        switch (storeType) {
            case ServerSideStoreType.Partial:
            case ServerSideStoreType.Full:
                return storeType;
            case null:
            case undefined:
                return ServerSideStoreType.Full;
            default:
                var types = Object.keys(ServerSideStoreType).join(', ');
                console.warn("AG Grid: invalid Server Side Store Type " + storeType + ", valid types are [" + types + "]");
                return ServerSideStoreType.Partial;
        }
    };
    __decorate([
        Autowired('gridOptionsWrapper')
    ], StoreFactory.prototype, "gridOptionsWrapper", void 0);
    __decorate([
        Autowired('columnController')
    ], StoreFactory.prototype, "columnController", void 0);
    StoreFactory = __decorate([
        Bean('ssrmStoreFactory')
    ], StoreFactory);
    return StoreFactory;
}());
export { StoreFactory };
