/*globals window, document, klass, utils*/

var Controls = klass({

	canvas: "",

	battleField: {
		offsetX: 0,
		offsetY: 0,
		width: 0,
		height: 0,
		dx: 0,
		dy: 0,
		x: null,
		y: null
	},

	tileSize: 0,
	scaledTileSize: 0,

	initialize: function (configs) {
		if (configs) {
			Object.extend(this, configs);
		}
	},

	setBattleFieldAttributes: function (obj) {
		Object.extend(this.battleField, obj);
	},


	handleClick: function (e) {
		this._cursorOnTheMap(e.clientX, e.clientY);
	},
	
	handleMouseDown: function(e) {
		this._startScrollMap(e.clientX, e.clientY);
	},
	
	handleMouseUp: function (e) {
		this._stopScrollMap(e.clientX, e.clientY);
	},
		
	handleMouseMove: function (e) {
		var pos = this._cursorOnTheMap(e.clientX, e.clientY);
		this.battleField.x = pos !== undefined ? pos.x : null;
		this.battleField.y = pos !== undefined ? pos.y : null;
	},

	/**
	 * Returns Map Coord where the mouse is hovering
	 * @return {[type]} [description]
	 */
	getMapMouseCoord: function () {
		return {
			x: this.battleField.x,
			y: this.battleField.y
		};
	},

	// TODO: precisa ser alterado para o novo formato do tiles
	// _cursorOnTheMap: function (clientX, clientY) {
	// 	var col = (clientY - this.battleField.offsetY) * 2;
	// 	col = ((this.battleField.offsetX + col) - clientX) / 2;

	// 	var row = ((clientX + col) - this.scaledTileSize) - this.battleField.offsetX + 63;

	// 	row = Math.floor(row / this.scaledTileSize);
	// 	col = Math.floor(col / this.scaledTileSize);

	// 	if (row >= 0 && col >= 0 && row <= (this.battleField.width - 1) && col <= (this.battleField.height - 1)) {
	// 		return {
	// 			x: row,
	// 			y: col
	// 		};
	// 	}
	// 	return;	
	// },
	
	_startScrollMap: function (x, y) {
		var startDragX = x,
			startDragY = y,
			endDragX = 0,
			endDragY = 0;
			
		utils.addListener(document.body, "mousemove", this._scrollingMap.bind(this));
	},
	
	_scrollingMap: function (e) {
		console.log("scrolling map");
	},
	
	_stopScrollMap: function () {
		utils.removeListener(document.body, "mousemove", this._scrollingMap);
	}
});
